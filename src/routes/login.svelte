<script>
  import { userData } from '../store';
  import { setClient } from '@urql/svelte';
	import { mutation } from '@urql/svelte';
  import client from '../_client';
  import Cookies from 'js-cookie';
  import { goto } from '$app/navigation';

  setClient(client);

  const loginMutation = mutation({
    query: `
      mutation ($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          secret
          ttl
          data {
            _id
            email
          }
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
    const resp = await loginMutation({ email, password })
    console.log(resp)
    Cookies.set('MY_SVELTE_APP', JSON.stringify(resp.data.login))
    userData.update((_prevState) => resp.data.login);
    alert('Login Successful');
    goto('/')
  }
</script>

<div class="wrap">
  <h3>Login Form</h3>
  <form on:submit|preventDefault={onSubmit} >
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
    <button class="button is-light" type="submit">Submit</button>
  </form>
</div>

<style>
  .wrap {
    max-width: 500px;
    margin: 0 auto;
  }
  h3 {
    margin-bottom: 20px;
  }
  input {
    margin-bottom: 20px;
  }
</style>