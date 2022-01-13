<script>
  import Cookies from 'js-cookie';
  const cookies = Cookies.get('MY_SVELTE_APP');
  let sessionToken;
  try {
    sessionToken = JSON.parse(cookies).secret 
  } catch (error) {
    console.log(error)
  }

  function handleLogout() {
    Cookies.remove('MY_SVELTE_APP');
    window.location.href = '/';
  }
</script>

<nav>
  <a href="/">Home</a>
  {#if sessionToken}
    <a on:click|once={handleLogout} href="#">Logout</a>
  {:else}
    <a href="/login">Login</a>
    <a href="/register">Register</a>
  {/if}
</nav>
<slot></slot>