<script setup lang="ts">
import "uno.css";
import { onMessage } from "webext-bridge/content-script";
import ActionBar from "./ActionBar";
import WritingAssist from "./WritingAssist";
import { Readability } from "@mozilla/readability";

onMessage("get-page-content", async () => {
    const documentClone = document.cloneNode(true) as Document;
    const article = new Readability(documentClone).parse();
    const pageContent = article?.textContent || "";
    return { pageContent };
});
</script>

<template>
    <ActionBar />
    <WritingAssist />
</template>
