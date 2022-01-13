<script>
  import { setClient } from '@urql/svelte';
	import { mutation } from '@urql/svelte';
  import client from '../_client'
  import { goto } from '$app/navigation';

  setClient(client);

  const registerMutation = mutation({
    query: `
      mutation ($email: String!, $password: String!) {
        register(email: $email, password: $password) {
          email
          _id
        }
      }
    `,
  });

  async function onSubmit(e) {
    const formData = new FormData(e.target);

    const data = {};
    for (let field of formData) {
      const [key, value] = field;
      data[key] = value;
    }
    const { email, password } = data;
    const resp = await registerMutation({ email, password })
    console.log(resp)
    alert('User Registered')
    goto('/')
  }
</script>

<div>
  <h3>Register Form</h3>
  <form on:submit|preventDefault={onSubmit}>
    <div>
        <label for="name">Email</label>
        <input
          type="text"
          id="email"
          name="email"
          value=""
        />
    </div>
    <div>
      <label for="name">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        value=""
      />
    </div>
    <button type="submit">Register</button>
  </form>
</div>