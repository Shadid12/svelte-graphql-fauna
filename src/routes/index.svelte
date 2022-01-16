<script context="module" lang="ts">
	export const prerender = true;
</script>


<script lang="ts">
  import { goto } from '$app/navigation';
	import { setClient } from '@urql/svelte';
	import { operationStore, query } from '@urql/svelte';
	import client from '../_client'
	setClient(client);
  const speakers = operationStore(`
    query {
      speakers {
        data {
          _id
          firstname
          lastname
          bio
          picture
        }
      }
    }
  `)
	query(speakers);

  const navigateToProfile = (id) => {
    goto(`/speakers/${id}`);
  }
</script>

<h1>All Speakers</h1>

{#if $speakers.fetching}
<p>Loading...</p>
{:else if $speakers.error}
<p>Oh no... {$speakers.error.message}</p>
{:else}


{#each $speakers.data.speakers.data as speaker}

<div class="card profile-card">
  <a href={`/speakers/${speaker._id}`} >
    <header class="card-header">
      <img src="https://avatarfiles.alphacoders.com/118/thumb-1920-118398.png" alt=""/>
      {speaker.firstname} {speaker.lastname}
    </header>
  </a>
</div>

{/each}

{/if}

<style>
  h1 {
    margin-bottom: 20px;
  }
  .profile-card {
    max-width: 300px;
  }
  header {
    padding: 20px;
    display: flex;
    align-items: center;
  }

  img {
    height: 60px;
    border-radius: 50%;
    margin-right: 10px;
  }
</style>