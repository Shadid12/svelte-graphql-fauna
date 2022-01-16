import fs from 'fs';
import { spawn } from 'child_process';
import gql from  'graphql-tag';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';



const retrieveInfo = async (fragment) => {
  let authable = [];
  if(fragment.definitions) {
    fragment.definitions.forEach(def => {
      if(def.directives && def.directives.length > 0) { 
        let authFilter = def.directives.filter(d => d.name.value === 'auth')
        authFilter.forEach(auth => { 
          authable.push({
            name: def.name.value,
            args: auth.arguments.map(a => ({ name: a.name.value, value: a.value.value })),
          })
        })
      }
    })
  }
  console.log('authable', JSON.stringify(authable))
  return authable;
}

const retrieveProtected = async (fragment) => { 
  let _protected = [];
  if(fragment.definitions) { 
    fragment.definitions.forEach(def => {
      if(def.directives && def.directives.length > 0) { 
        let protectedFilter = def.directives.filter(d => d.name.value === 'protected')
        protectedFilter.forEach(p => { 
          _protected.push({
            name: def.name.value,
            args: p.arguments.map(a => ({ name: a.name.value, value: a.value.values })),
          })
        })
      }
    })
  }
  return _protected;
}

const createAuthFunctions = async (authables) => { 
  const dir = 'fauna/functions'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');

  const content = `
import { query as q } from "faunadb";

export default {
  name: "Login${authModel.name}",
  body:
  q.Query(
    q.Lambda(
      ["${primaryKey.value}", "password"],
      q.Let(
        {
          credentials: q.Login(q.Match(q.Index("${authModel.name.toLowerCase()}_by_${primaryKey.value}"), q.Var("${primaryKey.value}")), {
            password: q.Var("password"),
            ttl: q.TimeAdd(q.Now(), 1800, "seconds")
          })
        },
        {
          secret: q.Select("secret", q.Var("credentials")),
          ttl: q.Select("ttl", q.Var("credentials")),
          data: q.Match(q.Index("${authModel.name.toLowerCase()}_by_${primaryKey.value}"), q.Var("${primaryKey.value}")),
        }
      )
    )
  )
};
  `

  const register = `
import { query as q } from "faunadb";

export default {
  name: "Register${authModel.name}",
  body:
  q.Query(
    q.Lambda(
      ["${primaryKey.value}", "password"],
      q.Create(q.Collection("${authModel.name}"), {
        credentials: { password: q.Var("password") },
        data: { ${primaryKey.value}: q.Var("${primaryKey.value}")}
      })
    )
  )
};
  `
  await fs.writeFileSync('fauna/functions/login.js', content)
  await fs.writeFileSync('fauna/functions/register.js', register)
}


const createAuthIndex = async (authables) => {
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');

  const dir = 'fauna/indexes'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }
  const content = `
  import { query as q } from "faunadb";

  export default {
    name: "${authModel.name.toLowerCase()}_by_${primaryKey.value}",
    source: q.Collection("${authModel.name}"),
    unique: true,
    terms: [
      {
        field: ["data", "${primaryKey.value}"]
      }
    ]
  }

`;

  await fs.writeFileSync('fauna/indexes/authindex.js', content)

}

const createSchema = async (authables) => {
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const dir = 'fauna'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const authModel = authables[0];
  const primaryKey = authModel.args.find(a => a.name === 'primary');
  const content = `
type Mutation {
  register(
    ${primaryKey.value}: String!, 
    password: String!
  ): ${authModel.name} @resolver(name: "Register${authModel.name}")
  login(
    ${primaryKey.value}: String!, 
    password: String!
  ): Token @resolver(name: "Login${authModel.name}")
}

type Token @embedded {
  ttl: Time!
  secret: String!
  data: ${authModel.name}
}
  `;
  await fs.writeFileSync('fauna/newschema.graphql', content)
} 

const createAuthRoles = async (authables, protectedModels) => { 
  if(authables.length > 1) { 
    console.log('Multiple Auth Models not Supported');
    return;
  }

  const authModel = authables[0]
  const dir = 'fauna/roles'
  if (!fs.existsSync(dir)){
    await fs.mkdirSync(dir, { recursive: true });
  }

  const predicates = `
    const onlyDeleteByOwner = q.Query(
      q.Lambda(
        "ref",
        q.Equals(q.CurrentIdentity(), q.Select(["data", "user"], q.Get(q.Var("ref"))))
      )
    );

    /**
     * Use this predicate to Restrict Create only to owner
     */
    // const onlyCreateByOwner = q.Query(
    //   q.Lambda(
    //     "values", 
    //     q.Equals(
    //       q.Identity(), 
    //       q.Select(["data", "owner"], q.Var("values"))
    //     )
    //   )
    // )

    /**
     * Use this predicate to Restrict Read only to owner
     */
    // const onlyReadByOwner = q.Query(
    //   q.Lambda("ref", q.Equals(
    //     q.Identity(), // logged in user
    //     q.Select(["data", "owner"], q.Get(q.Var("ref")))
    //   ))
    // )

    /**
     * User this predicate to Restrict Update only to owner
     */
    // const onlyOwnerWrite = q.Query(
    //   q.Lambda(
    //     ["oldData", "newData"],
    //     q.And(
    //       q.Equals(q.Identity(), q.Select(["data", "owner"], q.Var("oldData"))),
    //       q.Equals(
    //         q.Select(["data", "owner"], q.Var("oldData")),
    //         q.Select(["data", "owner"], q.Var("newData"))
    //       )
    //     )
    //   )
    // )


  `

  let privileges = `
    {
      resource: q.Collection("${authModel.name}"),
      actions: {
        read: true,
        create: true,
        delete: onlyDeleteByOwner
      }
    },`;

  protectedModels.forEach(m => { 
    let actions = {};
    const rule = m.args.filter(z => z.name === 'rule');
    rule[0].value.forEach(r => {
      actions[r.value] = true;
    });

    
    let prev = `{
      resource: q.Collection("${m.name}"),
      actions: ${JSON.stringify(actions)}
    }`;
    privileges += prev;
  });

  privileges = `[${privileges}],`;

  const content = `
  import { query as q } from "faunadb";
  ${predicates};
  export default {
    name: "${authModel.name}Role",
    privileges: ${privileges}
    membership: [
      {
        resource: q.Collection("${authModel.name}"),
      }
    ]
  }
  `
  await fs.writeFileSync('fauna/roles/authRole.js', content)
}


const main = async () => {
  try {
    const typeDefs = await fs.readFileSync('./schema.graphql').toString('utf-8');
    const fragment = gql`${typeDefs}`;
    const authables = await retrieveInfo(fragment);
    const protectedModels = await retrieveProtected(fragment);

    await createSchema(authables);
    await createAuthIndex(authables);
    await createAuthFunctions(authables);

    await createAuthRoles(authables, protectedModels);

    // merge graphql files
    const graphqlChanges = await fs.readFileSync('./fauna/newschema.graphql').toString('utf-8');
    const types = [
      typeDefs,
      graphqlChanges,
    ];

    const newTypeDefs = mergeTypeDefs(types);
    const schemaPrint = print(newTypeDefs);
    // const finalSchema = buildSchema(print(newTypeDefs));
    // console.log('finalSchema', JSON.stringify(newTypeDefs));
    let finalSchema = schemaPrint.split('schema')[0];
    await fs.writeFileSync('./fauna/schema.graphql', finalSchema);
    
    const child = spawn('./node_modules/.bin/fgu');

    child.stdout.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    
    child.on('close', () => {
      console.log(`Fauna GraphQL Schema Generated Successfully`);
    });

  } catch (err) {
    console.error(err)
  }
}

main();