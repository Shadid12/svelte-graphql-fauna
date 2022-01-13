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
<p>by {$talks.data.findSpeakerByID.firstname} {$talks.data.findSpeakerByID.lastname}</p>

<ul>
  {#each $talks.data.findSpeakerByID.talks.data as talk}
  <li>
    <a href={`/talks/${talk._id}`}>
      <h4>{talk.title}</h4>
      <div>{talk.description}</div>
    </a>
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- <iframe width="420" height="315" src={`https://www.youtube.com/embed/${talk.video_url}`}></iframe> -->
  </li>
  {/each}
</ul>

{/if}