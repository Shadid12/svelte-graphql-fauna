
  import { query as q } from "faunadb";

  export default {
    name: "user_by_email",
    source: q.Collection("User"),
    values: [
      { field: ["data", "email"] }
    ]
  }

