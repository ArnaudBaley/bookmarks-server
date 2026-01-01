<template>
  <div
    class="mt-8 flex relative lg:mt-0 lg:py-1 lg:pb-4 lg:pl-[80px] lg:before:content-[''] lg:before:absolute lg:before:left-0 lg:before:bottom-[calc(50%+25px)] lg:before:h-[calc(50%-25px)] lg:before:border-l lg:before:border-[var(--color-border)] lg:first:before:hidden lg:after:content-[''] lg:after:absolute lg:after:left-0 lg:after:top-[calc(50%+25px)] lg:after:h-[calc(50%-25px)] lg:after:border-l lg:after:border-[var(--color-border)] lg:last:after:hidden"
  >
    <i
      class="flex place-items-center place-content-center w-8 h-8 text-[var(--color-text)] lg:absolute lg:top-[calc(50%-25px)] lg:-left-[26px] lg:border lg:border-[var(--color-border)] lg:bg-[var(--color-background)] lg:rounded-lg lg:w-[50px] lg:h-[50px]"
    >
      <slot name="icon"></slot>
    </i>
    <div class="flex-1 ml-4">
      <h3 class="text-xl font-medium mb-1.5 text-[var(--color-heading)]">
        <slot name="heading"></slot>
      </h3>
      <slot></slot>
    </div>
  </div>
</template>
