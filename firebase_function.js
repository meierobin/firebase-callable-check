import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { info, error } from "firebase-functions/logger"
import { onCall, HttpsError } from 'firebase-functions/v2/https'

const callableOptions = {
    region: 'europe-west1',
    cors: ["https://www.heyinvite.com",  "https://www.app.heyinvite.com", "https://app.heyinvite.com"],
    invoker: "public"
};

export const geteventbyid = onCall(callableOptions, async ({data, auth}) => {

    if (!data.eventId || !(typeof data.eventId === 'string') || data.eventId.length === 0) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new HttpsError('invalid-argument', 'The function must be called with ' +
            'one arguments "eventId" containing the event id to fetch.');
    }

    try {

        const eventId = data.eventId;

        // successfully shown in logs
        info("Starting getEventById " + eventId);

        const currentUserId = auth != undefined ? auth.uid : null;


        const eventDocPromise = getFirestore().collection('events').doc(eventId).get();
        const promises = [eventDocPromise];

        if(currentUserId != null) {
            const guestPromise = getFirestore().collection('guests').where('event_id', '==', eventId).where('user_id', '==', currentUserId).get();
            promises.push(guestPromise);
        }


        const snapshots = await Promise.all(promises);

        const eventDocSnapshot = snapshots[0];

        let hostRecord = null;
        let eventData = null;
        if (eventDocSnapshot.exists) {

            hostRecord = await getAuth().getUser(eventDocSnapshot.data().user_id);

            const allowToSeeGuestlist = (eventDocSnapshot.data().guestlist_public_enabled == undefined || eventDocSnapshot.data().guestlist_public_enabled || currentUserId == eventDocSnapshot.data().user_id);

            eventData = {
                id: eventDocSnapshot.id,
                user_id: eventDocSnapshot.data().user_id,
                title: eventDocSnapshot.data().title,
                description: eventDocSnapshot.data().description,
                when: eventDocSnapshot.data().when,
                where: eventDocSnapshot.data().where,
                photo_url: eventDocSnapshot.data().photo_url,
                accept_count: allowToSeeGuestlist ? eventDocSnapshot.data().accept_count : "x",
                reject_count: allowToSeeGuestlist ? eventDocSnapshot.data().reject_count : "x",
                maybe_count: allowToSeeGuestlist ? eventDocSnapshot.data().maybe_count : "x",
                created_time: eventDocSnapshot.data().created_time,
                updated_time: eventDocSnapshot.data().updated_time,
                active: eventDocSnapshot.data().active,
                photo_position: eventDocSnapshot.data().photo_position,
                guestlist_public_enabled: eventDocSnapshot.data().guestlist_public_enabled != undefined ? eventDocSnapshot.data().guestlist_public_enabled : true,
                snap_cloud_enabled: eventDocSnapshot.data().snap_cloud_enabled != undefined ? eventDocSnapshot.data().snap_cloud_enabled : true
            }
        }

        let guestData = null;
        if(currentUserId != null) {
            const guestSnapshot = snapshots[1];

            if (!guestSnapshot.empty) {
                guestSnapshot.docs.forEach(doc => {
                    guestData = {
                        id: doc.id,
                        user_id: doc.data().user_id,
                        event_id: doc.data().event_id,
                        answer: doc.data().answer,
                        plus_guests: doc.data().plus_guests,
                        created_time: doc.data().created_time,
                        updated_time: doc.data().updated_time
                    }
                });
            }
        }

        let hostData = null;
        if (hostRecord != null) {
            hostData = {
                id: hostRecord.uid,
                displayName: hostRecord.displayName
            }
        }

        // successfully shown in logs
        info("Returning getEventById " + eventId);

        // info("Returning getEventById " + JSON.stringify(eventData) + "\n\n" + JSON.stringify(guestData) + "\n\n" + JSON.stringify(hostData))


        return { "event": eventData, "guest": guestData, "host": hostData };

    } catch (pError) {
        error("Ending with error getEventById: " + pError);
    }

});