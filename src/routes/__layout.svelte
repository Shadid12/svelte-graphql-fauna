<script>
  import { userData } from '../store.js';

  let userValue;

	const unsubscribe = userData.subscribe(value => {
		userValue = value;
	});

  function handleLogout() {
    Cookies.remove('MY_SVELTE_APP');
    userData.update((_prevState) => null);
    window.location.href = '/';
  }

  console.log('userValue', userValue);
</script>

<nav class="navbar">
  <div class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item" href="/">Home</a>
      {#if userValue}
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