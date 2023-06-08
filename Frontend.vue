<template>

</template>

<script setup>

import { onMounted } from "vue";

import { httpsCallableFromURL } from "firebase/functions";
import { PartyEventConverter } from "../models/PartyEvent.js";
import { GuestConverter } from "../models/Guest.js";
import { auth, functions } from "../services/firebase/config.js";

import * as Sentry from "@sentry/vue";

onMounted(() => {

  console.log("Get event by id: " + route.params.id);

  const getEventById = httpsCallableFromURL(functions, "https://geteventbyid-3axlxzr2hq-ew.a.run.app"); 
  getEventById({ eventId: route.params.id })
    .then((result) => {

      // error does not reach this but goes directly into catch
      
      console.log("then from geteventbyid");

      const data = result.data;
      console.log(data);

      if (data == null) {
        router.push("/404");
        return;
      }

      if(data.event == null) {
        router.push("/404");
        return;
      }

      if (data.event.active == false) {
        router.push("/404");
      }

      if (data != null && data.event != undefined) {
        const evt = PartyEventConverter.fromFirestore(data.event);
        eventStore.event = evt;
        eventStore.eventAcceptCount = evt.accept_count;
        eventStore.eventRejectCount = evt.reject_count;
        eventStore.eventMaybeCount = evt.maybe_count;
      }
      if (data != null && data.guest != undefined) {
        eventStore.guest = GuestConverter.fromFirestore(data.guest);
        eventStore.guestAnswerCache = data.guest.answer;
      }

      if (data != null && data.host != undefined) {
        eventStore.host = data.host;
      }

      // if already opened invite OR if host
      if (
        localStorage.getItem("openedInvite-" + route.params.id) == "true" ||
        (auth.currentUser != null &&
          eventStore.event.user_id == auth.currentUser.uid)
      ) {
        showSwipeWindow.value = false;
        document.body.style.position = "";
        document.body.style.left = "";
        document.body.style.right = "";
      }

      isLoading.value = false;
    })
    .catch((catchedError) => {

      const code = catchedError.code;
      const message = catchedError.message;
      const details = catchedError.details;

      error.value = catchedError + ". Bitte lade die Seite neu.";
      
      if(catchedError.code && catchedError.message && catchedError.details) {
        console.log(code + ", " + message + ", " + details);
      } else {
        console.log(catchedError);
      }

      Sentry.captureException(catchedError);
    });
});

</script>