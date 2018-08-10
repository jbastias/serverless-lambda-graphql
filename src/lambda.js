import 'babel-polyfill';
import { graphqlLambda, graphiqlLambda } from 'apollo-server-lambda';
import { makeExecutableSchema } from 'graphql-tools';
import { applyMiddleware } from 'graphql-middleware'

const typeDefs = `
type Query {
  hello(name: String): String
}
`;

const resolvers = {
  Query: {
    hello(parent, { name }, context, info) {
      const theName = name || 'world';
      return `hello ${theName}`;
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const logResult = async (resolve, root, args, context, info) => {
  console.log(`=== before the resolve ===`)
  const result = await resolve(root, args, context, info)
  console.log(`=== after the resolve: ${JSON.stringify(result)} ===`)
  return result
}

const schemaWithMiddleware = applyMiddleware(schema, logResult);

export const graphqlHandler = function(event, context, callback) {
  console.log('inside of the graphqlHandler method');
  console.log('event: ', JSON.stringify(event, null, 2));
  console.log('context: ', JSON.stringify(context, null, 2));
  context.callbackWaitsForEmptyEventLoop = false;

  const callbackFilter = function(error, output) {
    output.headers = Object.assign({}, output.headers, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    });
    console.log('OUTPUT: ', JSON.stringify(output, null, 2));
    callback(error, output);
  };
  const handler = graphqlLambda({
    schema: schemaWithMiddleware
   });
  return handler(event, context, callbackFilter);
};
