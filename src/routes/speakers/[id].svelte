<script>
  import { page } from '$app/stores';
  import { setClient } from '@urql/svelte';
	import { operationStore, query } from '@urql/svelte';
  import client from '../../_client'
  setClient(client);

  console.log('--->>', $page.params.id)
  
  const talks = operationStore(`
    query($id: ID!) {
      findSpeakerByID(id: $id) {
        _id
        firstname
        lastname
        talks {
          data {
            _id
            title
            description
            video_url
          }
        }
      }
    }
  `,
  { id: $page.params.id }
  )
	query(talks);

  console.log('Talks', talks)
</script>

<slot></slot>

<h1>All Talks </h1>
{#if $talks.fetching}
<p>Loading...</p>
{:else if $talks.error}
<p>Oh no... {$talks.error.message}</p>
{:else}
<p class="talk-by">by {$talks.data.findSpeakerByID.firstname} {$talks.data.findSpeakerByID.lastname}</p>


{#each $talks.data.findSpeakerByID.talks.data as talk}

<div class="card talk-item">
  <a href={`/talks/${talk._id}`} >
  <div class="card-content">
    <p class="title">
      {talk.title}
    </p>
    <p class="subtitle">
      {talk.description}
    </p>
  </div>
  </a>
</div>
{/each}

{/if}

<style>
  .talk-item {
    border: 1px solid;
    margin-bottom: 20px;
    max-width: 400px;
    box-shadow: 9px 10px 0 #5c7aff;
  }
  .talk-item:hover {
    box-shadow: 9px 10px 0 #e50774;
  }
  .talk-by {
    margin-bottom: 30px;
  }
</style>