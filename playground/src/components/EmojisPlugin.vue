<script setup lang="ts">
import { useLexicalComposer } from 'lexical-vue'
import useEmojis from '../composables/useEmojis'

const editor = useLexicalComposer()

useEmojis(editor)
</script>

<template />
