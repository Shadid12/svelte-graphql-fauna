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

<nav class="navbar">
  <div class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item" href="/">Home</a>
      {#if sessionToken}
        <a class="navbar-item" on:click|once={handleLogout} href="/#">Logout</a>
      {:else}
        <a class="navbar-item" href="/login">Login</a>
        <a class="navbar-item" href="/register">Register</a>
      {/if}
    </div>
  </div>
</nav>  
<div class="container">
  <slot></slot>
</div>