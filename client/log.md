commit 9abab0e1c65ffebdb1fdc9f390797071ade0c682
Author: Tobias Maestrini <tobias.maestrini@gmail.com>
Date:   Thu Oct 23 00:28:31 2025 +0200

    fix: update AZURE_CLIENT_SCOPE to correct value for API access

commit 3468030cc2207c0609ac9f2e835896f1064a82b2
Author: Tobias Maestrini <tobias.maestrini@gmail.com>
Date:   Thu Oct 16 22:01:59 2025 +0200

    refactor: update authority assignment in TokenAcquisitionHelper
    
    refactor: add AuthenticationResult import to TokenAcquisitionHelper
    
    refactor: update token acquisition methods and dependencies with @azure/identity instead of @azure/msal-node
    
    refactor: update start script path and restructure MCP client initialization
    
    refactor: rename handleUserInputsWithLLMLoop to agentTasksLoop for clarity
    
    refactor: rename experimental_MCPClient to MCPClient and update client initialization

commit bed741b11277072a1de571e8aa9bc4cb62945ccb
Author: Tobias Maestrini <tobias.maestrini@gmail.com>
Date:   Thu Oct 16 21:48:42 2025 +0200

    initial version
