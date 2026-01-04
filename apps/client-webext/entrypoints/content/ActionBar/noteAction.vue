<template>
    <div
        class="relative shrink-0 size-5 cursor-pointer"
        @click="handleTakingNote"
    >
        <img
            alt="Taking Note"
            class="block max-w-none size-full"
            :src="takingNote"
        />
    </div>
</template>

<script setup lang="ts">
import { sendMessage } from "webext-bridge/content-script";
import takingNote from "~/assets/taking-note.svg";

function handleTakingNote() {
    const text = window.getSelection()?.toString() || "";
    // Create a task for Taking Note so the sidepanel can pick it up
    // and open the dedicated TakingNote page
    import("~/logic/task").then(({ newTask }) => {
        newTask({
            type: "taking-note",
            parameters: { text, url: window.location.href },
        });
        sendMessage("open-sidepanel", { path: "/taking-note.html" });
    });
}
</script>
