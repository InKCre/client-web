<template>
  <section class="dev-home">
    <h1>Mail Extension</h1>
    <p>Registers canonical Email, Mailbox, EmailAddress, MailFlag, and MIME-part resolvers.</p>
  </section>
</template>

<style scoped lang="scss">
@use '@inkcre/ui-web/styles/mixins' as *;

.dev-home {
  max-width: 800px;
  margin: 0 auto;

  h1 {
    @include apply-font(title-lg);
  }

  p {
    color: var(--sys-color-text-subtle);
  }
}
</style>
