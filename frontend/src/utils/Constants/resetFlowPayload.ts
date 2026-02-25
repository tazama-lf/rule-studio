
export const RESET_FLOW_PAYLOAD = {
  nodes: [
    {
      id: "node-1",
      type: "Start",
      label: "Start",
      params: {},
      position: { x: 100, y: 50 }
    },
    {
      id: "node-2",
      type: "HandleTransaction",
      label: "Handle Transaction",
      params: {},
      position: { x: 98.59299754104964, y: 356.56161557336657 },
      nestedFlow: {
        nodes: [
          { id: "nested-node-1", type: "Start", label: "Start", params: {}, position: { x: 95, y: 10 } },
          { id: "nested-node-3", type: "If", label: "If Condition", params: { conditions: "[{\"type\":\"if\",\"condition\":\"!{{ RuleConfig.config.bands }}\"}]" }, position: { x: 93.7608298303277, y: 120.62851532468687 } },
          { id: "nested-node-4", type: "ThrowError", label: "Throw Error", params: { text: "'Invalid config provided - bands not provided'" }, position: { x: 357.1629555594102, y: 160.31778919890132 } },
          { id: "nested-node-5", type: "If", label: "If Condition", params: { conditions: "[{\"type\":\"if\",\"condition\":\"!{{ RuleConfig.config.exitConditions }}\"}]" }, position: { x: 91.33045264251172, y: 274.71292365084537 } },
          { id: "nested-node-6", type: "ThrowError", label: "Throw Error", params: { text: "'Invalid config provided - exitConditions not provided'" }, position: { x: 352.8050456755266, y: 319.5604549025939 } },
          { id: "nested-node-7", type: "If", label: "If Condition", params: { conditions: "[{\"type\":\"if\",\"condition\":\"!{{ RuleConfig.config.parameters }} || typeof {{ RuleConfig.config.parameters.tolerance }} != 'number'\"}]" }, position: { x: 92.6045206916749, y: 442.52701305199736 } },
          { id: "nested-node-8", type: "ThrowError", label: "Throw Error", params: { text: "'Invalid config provided - tolerance parameter not provided or invalid type'" }, position: { x: 348.6045206916749, y: 492.5270130519973 } },
          { id: "nested-node-37", type: "SetVariable", label: "Set Variable", params: { name: "countOfMatchingAmounts", declarationType: "var", dataType: "any", value: "" }, position: { x: 91.62772402136466, y: 618.726902204744 } },
          { id: "nested-node-36", type: "DetermineOutcome", label: "Determine Outcome", params: { argument1: "countOfMatchingAmounts", argument2: "ruleConfig", argument3: "ruleRes" }, position: { x: 90.84335068378368, y: 783.7986348876625 } },
          { id: "nested-node-2", type: "End", label: "End", params: {}, position: { x: 91.08211414224945, y: 955.9019925547354 } }
        ],
        edges: [
          { id: "xy-edge__nested-node-1source-nested-node-3target", source: "nested-node-1", target: "nested-node-3", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-3if-nested-node-4target", source: "nested-node-3", target: "nested-node-4", sourceHandle: "if", targetHandle: "target", label: "if", style: { stroke: "#4caf50", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-3exit-nested-node-5target", source: "nested-node-3", target: "nested-node-5", sourceHandle: "exit", targetHandle: "target", label: "exit", style: { stroke: "#000000", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-5if-nested-node-6target", source: "nested-node-5", target: "nested-node-6", sourceHandle: "if", targetHandle: "target", label: "if", style: { stroke: "#4caf50", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-5exit-nested-node-7target", source: "nested-node-5", target: "nested-node-7", sourceHandle: "exit", targetHandle: "target", label: "exit", style: { stroke: "#000000", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-7if-nested-node-8target", source: "nested-node-7", target: "nested-node-8", sourceHandle: "if", targetHandle: "target", label: "if", style: { stroke: "#4caf50", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-36source-nested-node-2target", source: "nested-node-36", target: "nested-node-2", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-7exit-nested-node-37target", source: "nested-node-7", target: "nested-node-37", sourceHandle: "exit", targetHandle: "target", label: "exit", style: { stroke: "#000000", strokeWidth: 2 } },
          { id: "xy-edge__nested-node-37source-nested-node-36target", source: "nested-node-37", target: "nested-node-36", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } }
        ]
      }
    },
    {
      id: "node-3",
      type: "End",
      label: "End",
      params: {},
      position: { x: 97.39125244304216, y: 520.607553746928 }
    },
    {
      id: "node-4",
      type: "TypeDefinition",
      label: "Define: Type/Interface",
      params: {
        typeKind: "type",
        typeName: "RuleExecutorConfig",
        typeDefinition: "Required<Pick<ManagerConfig, 'rawHistory' | 'eventHistory' | 'configuration' | 'localCacheConfig'>>"
      },
      position: { x: 98.3607775527181, y: 198.09837373216718 },
      mode: "definition",
      generation_type: "definition",
      function_name: "TypeDefinition"
    }
  ],
  edges: [
    { id: "xy-edge__node-2source-node-3target", source: "node-2", target: "node-3", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } },
    { id: "xy-edge__node-1source-node-4target", source: "node-1", target: "node-4", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } },
    { id: "xy-edge__node-4source-node-2target", source: "node-4", target: "node-2", sourceHandle: "source", targetHandle: "target", style: { stroke: "#555", strokeWidth: 2 } }
  ]
};
