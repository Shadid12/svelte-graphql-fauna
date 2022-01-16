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

<div class="wrap">
  <h3>Register Form</h3>
  <form on:submit|preventDefault={onSubmit}>
    <div>
        <label for="name">Email</label>
        <input
          type="text"
          id="email"
          name="email"
          value=""
          class="input"
        />
    </div>
    <div>
      <label for="name">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        value=""
        class="input"
      />
    </div>
    <button class="button is-light" type="submit">Register</button>
  </form>
</div>

<style>
  .wrap {
    max-width: 400px;
    margin: 0 auto;
  }
  h3 {
    margin-bottom: 20px;
  }
  input {
    margin-bottom: 20px;
  }
</style>