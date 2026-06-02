#!/usr/bin/env bash
# =============================================================================
# sim.sh -- Tazama Rule Simulation Manager
#
# Spin up / tear down isolated simulation instances for testing Tazama rules.
# Each simulation gets its own Docker Compose project, network, and volumes.
#
# Usage:
#   ./sim.sh init                              Fetch SQL migration data (run once)
#   ./sim.sh spawn  <name> [OPTIONS]           Create & start a simulation
#   ./sim.sh destroy <name>                    Tear down a simulation (removes volumes)
#   ./sim.sh destroy-all                       Tear down ALL simulations
#   ./sim.sh list                              List running simulations
#   ./sim.sh logs <name> [service]             View logs
#   ./sim.sh test <name> [payload-file]        Send a test message via NATS utilities
#   ./sim.sh status <name>                     Health-check a simulation
#
# Spawn options:
#   --rule <NUMBER>         Rule number to deploy (default: 901)
#   --version <TAG>         Tazama image version tag (default: 1.0.0)
#   --port-offset <N>       Port offset for parallel simulations (default: auto)
#
# Examples:
#   ./sim.sh init
#   ./sim.sh spawn sim-001
#   ./sim.sh spawn sim-002 --rule 902 --port-offset 10
#   ./sim.sh test sim-001
#   ./sim.sh destroy sim-001
#   ./sim.sh destroy-all
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/_repo"
SIMS_DIR="${SCRIPT_DIR}/.sims"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yaml"

# Default base ports (from .env)
BASE_PG_PORT=15432
BASE_NATS_PORT=14222
BASE_NATS_MONITOR_PORT=18222
BASE_VALKEY_PORT=16379
BASE_NATS_UTILS_PORT=4000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${GREEN}[sim]${NC} $*"; }
warn()  { echo -e "${YELLOW}[sim]${NC} $*"; }
err()   { echo -e "${RED}[sim]${NC} $*" >&2; }
header(){ echo -e "\n${BOLD}${CYAN}$*${NC}"; }

# ---- helpers ----------------------------------------------------------------

ensure_init() {
    if [[ ! -d "${REPO_DIR}/core/postgres/migration" ]]; then
        err "SQL migration data not found. Run './sim.sh init' first."
        exit 1
    fi
}

next_offset() {
    mkdir -p "${SIMS_DIR}"
    local max=0
    for f in "${SIMS_DIR}"/*.env; do
        [[ -f "$f" ]] || continue
        local o
        o=$(grep '^PORT_OFFSET=' "$f" 2>/dev/null | cut -d= -f2)
        if [[ -n "$o" ]] && (( o > max )); then
            max=$o
        fi
    done
    echo $(( max + 10 ))
}

project_name() {
    echo "tazama-sim-${1}"
}

sim_env_file() {
    echo "${SIMS_DIR}/${1}.env"
}

get_sim_var() {
    local sim="$1" var="$2"
    grep "^${var}=" "$(sim_env_file "$sim")" 2>/dev/null | cut -d= -f2
}

# ---- commands ---------------------------------------------------------------

cmd_init() {
    header "Initializing simulation environment"

    if [[ -d "${REPO_DIR}" ]]; then
        log "Repo already cloned. Pulling latest..."
        git -C "${REPO_DIR}" pull --ff-only || warn "Pull failed -- using existing data"
    else
        local branch="${REPO_BRANCH:-dev}"
        log "Cloning Full-Stack-Docker-Tazama (branch: ${branch})..."
        git clone --depth 1 -b "${branch}" \
            https://github.com/tazama-lf/Full-Stack-Docker-Tazama.git \
            "${REPO_DIR}"
    fi

    if [[ -d "${REPO_DIR}/core/postgres/migration" ]]; then
        log "SQL migration data ready."
    else
        err "Migration directory not found after clone."
        exit 1
    fi

    mkdir -p "${SIMS_DIR}"
    log "Initialization complete."
}

cmd_spawn() {
    local name="${1:?Usage: sim.sh spawn <name> [OPTIONS]}"
    shift

    # Parse options
    local rule_num="901"
    local tazama_ver="rc"
    local port_offset=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --rule)       rule_num="$2";      shift 2 ;;
            --version)    tazama_ver="$2";    shift 2 ;;
            --port-offset) port_offset="$2";  shift 2 ;;
            *) err "Unknown option: $1"; exit 1 ;;
        esac
    done

    ensure_init

    local env_file
    env_file="$(sim_env_file "$name")"
    mkdir -p "${SIMS_DIR}"

    if [[ -f "$env_file" ]]; then
        warn "Simulation '${name}' already exists. Destroy it first or pick another name."
        exit 1
    fi

    # Auto-assign port offset
    if [[ -z "$port_offset" ]]; then
        port_offset=$(next_offset)
    fi

    local pg_port=$(( BASE_PG_PORT + port_offset ))
    local nats_port=$(( BASE_NATS_PORT + port_offset ))
    local nats_mon=$(( BASE_NATS_MONITOR_PORT + port_offset ))
    local valkey_port=$(( BASE_VALKEY_PORT + port_offset ))
    local nats_utils_port=$(( BASE_NATS_UTILS_PORT + port_offset ))
    local rule_fn="rule-${rule_num}-rel-${tazama_ver}"
    local nats_sub="sub-rule-${rule_num}@${tazama_ver}"
    local nats_pub="pub-rule-${rule_num}@${tazama_ver}"

    # Persist simulation metadata
    cat > "$env_file" <<EOF
PORT_OFFSET=${port_offset}
RULE_NUM=${rule_num}
TAZAMA_VERSION=${tazama_ver}
RULE_IMAGE=rule-${rule_num}
RULE_NAME=${rule_num}
RULE_VERSION=${tazama_ver}
RULE_FUNCTION_NAME=${rule_fn}
NATS_SUB=${nats_sub}
NATS_PUB=${nats_pub}
PG_PORT=${pg_port}
NATS_PORT=${nats_port}
NATS_MONITOR_PORT=${nats_mon}
VALKEY_PORT=${valkey_port}
NATS_UTILS_PORT=${nats_utils_port}
NATS_UTILS_VERSION=latest
EOF

    local proj
    proj="$(project_name "$name")"

    header "Spawning simulation: ${name}"
    log "Rule:            rule-${rule_num} (${tazama_ver})"
    log "Project:         ${proj}"
    log "Ports:"
    log "  PostgreSQL:    ${pg_port}"
    log "  NATS:          ${nats_port}"
    log "  NATS Monitor:  ${nats_mon}"
    log "  Valkey:         ${valkey_port}"
    log "  NATS Utilities: ${nats_utils_port}"
    echo ""

    # Export env vars and launch
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a

    docker compose -f "${COMPOSE_FILE}" -p "${proj}" \
        --env-file "$env_file" \
        up -d --pull missing

    # Seed DB with rule config for the deployed rule version
    local rule_id="${RULE_NAME:-901}@${TAZAMA_VERSION:-rc}"
    local seed_sql="${SCRIPT_DIR}/sql/seed-rule-901.sql"
    if [[ -f "$seed_sql" ]]; then
        local pg_container="${proj}-postgres-1"
        # Wait up to 30s for postgres to be ready
        local attempts=0
        while ! docker exec "$pg_container" pg_isready -U postgres -q 2>/dev/null; do
            sleep 1
            (( attempts++ ))
            [[ $attempts -ge 30 ]] && break
        done
        # Substitute the rule version in the seed SQL and run it
        local seed_content
        seed_content=$(sed "s/901@1.0.0/${rule_id}/g" "$seed_sql")
        echo "$seed_content" | docker exec -i "$pg_container" psql -U postgres -d configuration -q 2>/dev/null \
            && log "DB seeded: rule config for ${rule_id}" \
            || warn "DB seed skipped (postgres not ready yet — run manually)"
    fi

    echo ""
    log "Simulation '${name}' is starting."
    log "Wait for postgres to become healthy (~30-60s), then test with:"
    echo ""
    echo -e "  ${CYAN}./sim.sh test ${name}${NC}"
    echo ""
    echo -e "  Or manually via curl:"
    echo -e "  ${CYAN}curl -X POST http://localhost:${nats_utils_port}/natsPublish \\\\${NC}"
    echo -e "  ${CYAN}  -H 'Content-Type: application/json' \\\\${NC}"
    echo -e "  ${CYAN}  -d '{${NC}"
    echo -e "  ${CYAN}    \"message\": {},${NC}"
    echo -e "  ${CYAN}    \"destination\": \"${nats_sub}\",${NC}"
    echo -e "  ${CYAN}    \"consumer\": \"${nats_pub}\",${NC}"
    echo -e "  ${CYAN}    \"functionName\": \"${rule_fn}\",${NC}"
    echo -e "  ${CYAN}    \"awaitReply\": true${NC}"
    echo -e "  ${CYAN}  }'${NC}"
}

cmd_destroy() {
    local name="${1:?Usage: sim.sh destroy <name>}"
    local env_file
    env_file="$(sim_env_file "$name")"

    if [[ ! -f "$env_file" ]]; then
        err "Simulation '${name}' not found."
        exit 1
    fi

    local proj
    proj="$(project_name "$name")"

    header "Destroying simulation: ${name}"

    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a

    docker compose -f "${COMPOSE_FILE}" -p "${proj}" \
        --env-file "$env_file" \
        down -v --remove-orphans

    rm -f "$env_file"
    log "Simulation '${name}' destroyed."
}

cmd_destroy_all() {
    header "Destroying ALL simulations"
    local found=0
    for f in "${SIMS_DIR}"/*.env; do
        [[ -f "$f" ]] || continue
        found=1
        local sim_name
        sim_name="$(basename "$f" .env)"
        cmd_destroy "$sim_name"
    done
    if [[ $found -eq 0 ]]; then
        log "No simulations found."
    fi
}

cmd_list() {
    header "Active simulations"
    echo ""
    printf "  ${BOLD}%-15s %-10s %-10s %-8s %-8s %-8s %-8s %-8s${NC}\n" \
        "NAME" "RULE" "VERSION" "PG" "NATS" "VALKEY" "UTILS" "OFFSET"
    echo "  $(printf '%.0s-' {1..85})"

    local found=0
    for f in "${SIMS_DIR}"/*.env; do
        [[ -f "$f" ]] || continue
        found=1
        local sim_name
        sim_name="$(basename "$f" .env)"

        local rule_num pg nats valkey utils offset
        rule_num=$(get_sim_var "$sim_name" "RULE_NUM")
        pg=$(get_sim_var "$sim_name" "PG_PORT")
        nats=$(get_sim_var "$sim_name" "NATS_PORT")
        valkey=$(get_sim_var "$sim_name" "VALKEY_PORT")
        utils=$(get_sim_var "$sim_name" "NATS_UTILS_PORT")
        offset=$(get_sim_var "$sim_name" "PORT_OFFSET")
        local ver
        ver=$(get_sim_var "$sim_name" "TAZAMA_VERSION")

        # Check if running
        local proj
        proj="$(project_name "$sim_name")"
        local running
        running=$(docker compose -f "${COMPOSE_FILE}" -p "${proj}" ps -q 2>/dev/null | wc -l)
        local status_icon
        if (( running > 0 )); then
            status_icon="${GREEN}●${NC}"
        else
            status_icon="${RED}○${NC}"
        fi

        printf "  ${status_icon} %-14s %-10s %-10s %-8s %-8s %-8s %-8s %-8s\n" \
            "$sim_name" "$rule_num" "$ver" "$pg" "$nats" "$valkey" "$utils" "$offset"
    done

    if [[ $found -eq 0 ]]; then
        echo "  (none)"
    fi
    echo ""
}

cmd_logs() {
    local name="${1:?Usage: sim.sh logs <name> [service]}"
    local service="${2:-}"
    local env_file
    env_file="$(sim_env_file "$name")"

    if [[ ! -f "$env_file" ]]; then
        err "Simulation '${name}' not found."
        exit 1
    fi

    local proj
    proj="$(project_name "$name")"

    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a

    if [[ -n "$service" ]]; then
        docker compose -f "${COMPOSE_FILE}" -p "${proj}" --env-file "$env_file" logs -f "$service"
    else
        docker compose -f "${COMPOSE_FILE}" -p "${proj}" --env-file "$env_file" logs -f
    fi
}

cmd_status() {
    local name="${1:?Usage: sim.sh status <name>}"
    local env_file
    env_file="$(sim_env_file "$name")"

    if [[ ! -f "$env_file" ]]; then
        err "Simulation '${name}' not found."
        exit 1
    fi

    local proj
    proj="$(project_name "$name")"

    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a

    header "Status: ${name}"
    docker compose -f "${COMPOSE_FILE}" -p "${proj}" --env-file "$env_file" ps
}

cmd_test() {
    local name="${1:?Usage: sim.sh test <name> [payload-file]}"
    local payload_file="${2:-}"
    local env_file
    env_file="$(sim_env_file "$name")"

    if [[ ! -f "$env_file" ]]; then
        err "Simulation '${name}' not found."
        exit 1
    fi

    local nats_utils_port rule_fn nats_sub nats_pub
    nats_utils_port=$(get_sim_var "$name" "NATS_UTILS_PORT")
    rule_fn=$(get_sim_var "$name" "RULE_FUNCTION_NAME")
    nats_sub=$(get_sim_var "$name" "NATS_SUB")
    nats_pub=$(get_sim_var "$name" "NATS_PUB")

    # Check NATS utilities health
    header "Testing simulation: ${name}"
    log "NATS Utilities: http://localhost:${nats_utils_port}"
    log "Rule function:  ${rule_fn}"
    log "NATS subject:   ${nats_sub}"
    echo ""

    local health
    health=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${nats_utils_port}/" 2>/dev/null || echo "000")
    if [[ "$health" != "200" ]]; then
        err "NATS Utilities not responding (HTTP ${health}). Is the simulation running?"
        exit 1
    fi
    log "NATS Utilities health: OK"

    local message='{}'
    local await_reply="false"
    if [[ -n "$payload_file" && -f "$payload_file" ]]; then
        message=$(cat "$payload_file")
        await_reply="true"
        log "Using payload from: ${payload_file}"
    else
        log "Using empty test payload (provide a JSON file as second arg for custom payloads)"
    fi

    local body
    body=$(cat <<EOJSON
{
  "message": ${message},
  "destination": "${nats_sub}",
  "consumer": "${nats_pub}",
  "functionName": "${rule_fn}",
  "awaitReply": ${await_reply}
}
EOJSON
)

    echo ""
    log "Sending to NATS..."
    echo ""

    local response
    response=$(curl -s --max-time 10 -X POST "http://localhost:${nats_utils_port}/natsPublish" \
        -H 'Content-Type: application/json' \
        -d "$body" 2>/dev/null)

    if [[ -z "$response" ]]; then
        warn "No response (timed out or connection failed)"
    else
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi

    echo ""
    log "Check rule processor logs:"
    log "  docker logs tazama-sim-${name}-rule-processor-1"

    echo ""
}

# ---- main -------------------------------------------------------------------

usage() {
    cat <<'EOF'

  Tazama Rule Simulation Manager

  Usage:
    ./sim.sh init                            Fetch SQL migration data (run once)
    ./sim.sh spawn  <name> [OPTIONS]         Create & start a simulation
    ./sim.sh destroy <name>                  Tear down a simulation
    ./sim.sh destroy-all                     Tear down ALL simulations
    ./sim.sh list                            List simulations
    ./sim.sh logs <name> [service]           View logs
    ./sim.sh status <name>                   Service health
    ./sim.sh test <name> [payload.json]      Send test message via NATS utilities

  Spawn options:
    --rule <NUMBER>         Rule number (default: 901)
    --version <TAG>         Image version tag (default: rc)
    --port-offset <N>       Port offset (default: auto)

  Examples:
    ./sim.sh init
    ./sim.sh spawn my-test
    ./sim.sh spawn rule902-test --rule 902
    ./sim.sh spawn multi --rule 901 --port-offset 20
    ./sim.sh test my-test
    ./sim.sh test my-test payloads/pacs002.json
    ./sim.sh destroy my-test

EOF
}

cmd="${1:-}"
shift 2>/dev/null || true

case "$cmd" in
    init)        cmd_init ;;
    spawn)       cmd_spawn "$@" ;;
    destroy)     cmd_destroy "$@" ;;
    destroy-all) cmd_destroy_all ;;
    list)        cmd_list ;;
    logs)        cmd_logs "$@" ;;
    status)      cmd_status "$@" ;;
    test)        cmd_test "$@" ;;
    -h|--help|help|"")
        usage
        ;;
    *)
        err "Unknown command: ${cmd}"
        usage
        exit 1
        ;;
esac
