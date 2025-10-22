// Interface for authentication context
export interface IAuthContext {
    token?: string;
}

// For stateful servers, we store authentication context per connection
class StatefulAuthContext {
    #authContextMap = new Map<string, IAuthContext>();

    // Helper functions to manage auth context
    setAuthContext = (connectionId: string, context: IAuthContext) => {
        this.#authContextMap.set(connectionId, context);
    }

    getAuthContext = (connectionId: string): IAuthContext | undefined => {
        return this.#authContextMap.get(connectionId);
    }

    clearAuthContext = (connectionId: string) => {
        this.#authContextMap.delete(connectionId);
    }
}

// For stateless servers, we can use a simple current cont
class StatelessAuthContext {
    #currentAuthContext: IAuthContext | undefined = undefined;

    setAuthContext = (context: IAuthContext) => {
        this.#currentAuthContext = context;
    }

    getAuthContext = (): IAuthContext | undefined => {
        return this.#currentAuthContext;
    }

    clearAuthContext = () => {
        this.#currentAuthContext = undefined;
    }
}

export const authContext = {
    Stateful: new StatefulAuthContext(),
    Stateless: new StatelessAuthContext()
};
