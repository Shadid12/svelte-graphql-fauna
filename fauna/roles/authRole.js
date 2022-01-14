
  import { query as q } from "faunadb";
  
    const onlyDeleteByOwner = q.Query(
      q.Lambda(
        "ref",
        q.Equals(q.CurrentIdentity(), q.Select(["data", "user"], q.Get(q.Var("ref"))))
      )
    );
  ;
  export default {
    name: "UserRole",
    privileges: [
    {
      resource: q.Collection("User"),
      actions: {
        read: true,
        create: true,
        delete: onlyDeleteByOwner
      }
    }
  ],
    membership: [
      {
        resource: q.Collection("User"),
      }
    ]
  }
  