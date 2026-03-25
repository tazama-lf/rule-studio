\connect configuration;

CREATE TABLE public.trs_rule_flow (
	id serial4 NOT NULL,
	rule_id int4 NOT NULL,
	flow_json_rule_builder jsonb NOT NULL,
	ts_file_base64_rule_builder text NULL,
	flow_json_test_case jsonb NOT NULL,
	ts_file_base64_test_case text NULL,
	tenant_id varchar(255) DEFAULT 'DEFAULT'::character varying NOT NULL,
	status_rule_builder varchar(255) DEFAULT 'initial'::character varying NULL,
	status_test_case varchar(255) DEFAULT 'initial'::character varying NULL,
	created_at date NULL,
	updated_at date NULL,
	CONSTRAINT trs_rule_flow_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_trs_rule_flow_rule_id ON trs_rule_flow (rule_id);

CREATE TABLE public.trs_rules (
	id serial4 NOT NULL,
	rule_name varchar(100) NULL,
	rule_type varchar(100) NULL,
	rule_config_id varchar(30) NULL,
	description varchar(255) NOT NULL,
	tenant_id varchar(255) NOT NULL,
	txtp varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	status varchar(50) NOT NULL,
	publishing_status varchar(255) NOT NULL,
	updated_by varchar(255) NOT NULL,
	updated_at timestamp NULL,
	created_at timestamp NULL,
	rulerequest jsonb DEFAULT '{}'::jsonb NULL,
	txtp_version varchar(50) NULL,
	"comments" varchar(50) NULL,
	metadata jsonb DEFAULT '{"sync": true, "test": false, "deploy": false, "simulation": false}'::jsonb NULL,
	CONSTRAINT trs_rules_pkey PRIMARY KEY (id, tenant_id, version)
);

-- Index on tenant_id for faster retrieval of rules by tenant
CREATE INDEX idx_trs_rules_tenant_id ON trs_rules (tenant_id);

-- Index on status for faster filtering based on rule status
CREATE INDEX idx_trs_rules_status ON trs_rules (status);

-- Index on version for faster version-based queries
CREATE INDEX idx_trs_rules_version ON trs_rules (version);

-- Composite index if you frequently query by tenant_id and status together
CREATE INDEX idx_trs_rules_tenant_status ON trs_rules (tenant_id, status);

CREATE TABLE public.trs_nodes (
	id serial4 NOT NULL,
	node_json jsonb NOT NULL,
	tenant_id varchar(255) DEFAULT 'DEFAULT'::character varying NOT NULL,
	created_by varchar(255) NULL,
	"order" varchar(255) NULL,
	created_at date NULL,
	updated_at date NULL,
	CONSTRAINT trs_nodes_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_nodes_tenant_id ON trs_nodes (tenant_id);
\connect configuration;

CREATE TABLE public.trs_rule_flow (
	id serial4 NOT NULL,
	rule_id int4 NOT NULL,
	flow_json_rule_builder jsonb NOT NULL,
	ts_file_base64_rule_builder text NULL,
	flow_json_test_case jsonb NOT NULL,
	ts_file_base64_test_case text NULL,
	tenant_id varchar(255) DEFAULT 'DEFAULT'::character varying NOT NULL,
	status_rule_builder varchar(255) DEFAULT 'initial'::character varying NULL,
	status_test_case varchar(255) DEFAULT 'initial'::character varying NULL,
	created_at date NULL,
	updated_at date NULL,
	CONSTRAINT trs_rule_flow_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_trs_rule_flow_rule_id ON trs_rule_flow (rule_id);

CREATE TABLE public.trs_rules (
	id serial4 NOT NULL,
	rule_name varchar(100) NULL,
	rule_type varchar(100) NULL,
	rule_config_id varchar(30) NULL,
	description varchar(255) NOT NULL,
	tenant_id varchar(255) NOT NULL,
	txtp varchar(50) NOT NULL,
	"version" varchar(50) NOT NULL,
	status varchar(50) NOT NULL,
	publishing_status varchar(255) NOT NULL,
	updated_by varchar(255) NOT NULL,
	updated_at timestamp NULL,
	created_at timestamp NULL,
	rulerequest jsonb DEFAULT '{}'::jsonb NULL,
	txtp_version varchar(50) NULL,
	"comments" varchar(50) NULL,
	metadata jsonb DEFAULT '{"sync": true, "test": false, "deploy": false, "simulation": false}'::jsonb NULL,
	CONSTRAINT trs_rules_pkey PRIMARY KEY (id, tenant_id, version)
);

-- Index on tenant_id for faster retrieval of rules by tenant
CREATE INDEX idx_trs_rules_tenant_id ON trs_rules (tenant_id);

-- Index on status for faster filtering based on rule status
CREATE INDEX idx_trs_rules_status ON trs_rules (status);

-- Index on version for faster version-based queries
CREATE INDEX idx_trs_rules_version ON trs_rules (version);

-- Composite index if you frequently query by tenant_id and status together
CREATE INDEX idx_trs_rules_tenant_status ON trs_rules (tenant_id, status);

CREATE TABLE public.trs_nodes (
	id serial4 NOT NULL,
	node_json jsonb NOT NULL,
	tenant_id varchar(255) DEFAULT 'DEFAULT'::character varying NOT NULL,
	created_by varchar(255) NULL,
	"order" varchar(255) NULL,
	created_at date NULL,
	updated_at date NULL,
	CONSTRAINT trs_nodes_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_nodes_tenant_id ON trs_nodes (tenant_id);
