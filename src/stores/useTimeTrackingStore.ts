import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DateTime } from 'luxon';
import type { IBooking, CouchDb, ITracking } from '@/components/TimeTracking/types';
import { getLocalBookingDbSync, getLocalBookingDb, remoteBookingDb, syncBookingChanges } from '@/components/TimeTracking/pouchdb';
import { v4 as uuidv4 } from 'uuid';

interface TimeTrackingState {
    booking: IBooking;
    bookingList: IBooking[];
    selectedBooking: number;
    bookingDbConf: CouchDb;
    isDbTokenInvalid: boolean;

    // Computed values (derived from state)
    activeTracking: ITracking | null;
    isTimeTrackingActive: boolean;
    computedBooking: IBooking | null;

    // Actions
    setBooking: (booking: IBooking) => void;
    setBookingList: (bookingList: IBooking[]) => void;
    setSelectedBooking: (selectedBooking: number) => void;
    setBookingDbConf: (dbConf: CouchDb) => void;
    setDbTokenInvalid: (isInvalid: boolean) => void;

    // Tracking Actions
    startTracking: (description: string) => void;
    pauseTracking: () => void;
    stopTracking: () => void;
    initDb: (conf: CouchDb) => Promise<void>;
}

// Domain logic helpers
const getActiveTracking = (booking: IBooking) => {
    return booking?.trackings?.find(
        (tracking) => tracking.id === booking.activeTracking,
    ) || null;
};

const getIsTimeTrackingActive = (activeTracking: ITracking | null | undefined) => {
    return !!activeTracking;
};

const addTimeDiff = (time: ITracking, dateTime: DateTime<true> | DateTime<false>) => {
    if (!time.stop) return dateTime;
    const val = DateTime.fromISO(time.stop as string)
        .diff(DateTime.fromISO(time.start as string), ['hours', 'minutes'])
        .toObject();
    return dateTime.plus({
        hour: val.hours,
        minute: val.minutes,
    });
};

const getComputedBooking = (booking: IBooking) => {
    if (booking?.createdAt) {
        let dateTime = DateTime.fromObject({
            day: DateTime.fromISO(booking.createdAt).day,
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        });
        booking?.trackings?.forEach((time) => {
            dateTime = addTimeDiff(time, dateTime);
        });
        return {
            ...booking,
            bookableHours: dateTime.toFormat('HH:mm'),
        };
    } else {
        return null;
    }
};

export const useTimeTrackingStore = create<TimeTrackingState>()(
    devtools(
        persist(
            (set, get) => ({
                booking: {} as IBooking,
                bookingList: [],
                selectedBooking: 0,
                bookingDbConf: {} as CouchDb,
                isDbTokenInvalid: false,
                activeTracking: null,
                isTimeTrackingActive: false,
                computedBooking: null,

                setBooking: (booking) => {
                    const activeTracking = getActiveTracking(booking);
                    const isTimeTrackingActive = getIsTimeTrackingActive(activeTracking);
                    const computedBooking = getComputedBooking(booking);

                    set({
                        booking,
                        activeTracking,
                        isTimeTrackingActive,
                        computedBooking
                    });
                },

                setBookingList: (bookingList) => set({ bookingList }),
                setSelectedBooking: (selectedBooking) => set({ selectedBooking }),
                setBookingDbConf: (bookingDbConf) => set({ bookingDbConf }),
                setDbTokenInvalid: (isDbTokenInvalid) => set({ isDbTokenInvalid }),

                startTracking: (description: string) => {
                    const { booking, setBooking } = get();
                    const now = DateTime.now().toISO();

                    console.log('🕐 Starting tracking:', { description, now });

                    let newBooking = { ...booking };

                    // If no current booking or it's closed, create a new one
                    if (!newBooking._id || newBooking.closed) {
                        newBooking = {
                            _id: uuidv4(),
                            bookingId: uuidv4(),
                            createdAt: now,
                            closed: 0,
                            bookableHours: '00:00',
                            trackings: []
                        };
                        console.log('📝 Created new booking:', newBooking._id);
                    } else {
                        console.log('📝 Using existing booking:', newBooking._id);
                    }

                    const newTrackingId = uuidv4();
                    const newTracking: ITracking = {
                        id: newTrackingId,
                        start: now,
                        active: 1,
                        task: { label: description }
                    };

                    newBooking.activeTracking = newTrackingId;
                    newBooking.trackings = [...(newBooking.trackings || []), newTracking];

                    console.log('⚡ Updated booking with new tracking:', {
                        bookingId: newBooking._id,
                        trackingId: newTrackingId,
                        trackingCount: newBooking.trackings?.length
                    });

                    setBooking(newBooking);
                    
                    const localDb = getLocalBookingDbSync();
                    console.log('💾 Saving to database...');
                    
                    localDb.put(newBooking)
                        .then((result: any) => {
                            console.log('✅ Successfully saved to database:', result);
                        })
                        .catch((err: any) => {
                            console.error('❌ Database save error:', err);
                            if (err.name === 'conflict') {
                                console.log('🔄 Handling conflict, retrying...');
                                localDb.get(newBooking._id).then((doc: any) => {
                                    newBooking._rev = doc._rev;
                                    return localDb.put(newBooking);
                                }).then((result: any) => {
                                    console.log('✅ Conflict resolved, saved:', result);
                                });
                            }
                        });
                },

                pauseTracking: () => {
                    const { booking, setBooking } = get();
                    if (!booking.activeTracking) return;

                    const now = DateTime.now().toISO();
                    const newBooking = { ...booking };

                    newBooking.trackings = newBooking.trackings?.map(t => {
                        if (t.id === newBooking.activeTracking) {
                            return { ...t, stop: now, active: 0 };
                        }
                        return t;
                    });

                    newBooking.activeTracking = undefined;
                    setBooking(newBooking);

                    const localDb = getLocalBookingDbSync();
                    localDb.get(newBooking._id).then((doc: any) => {
                        newBooking._rev = doc._rev;
                        return localDb.put(newBooking);
                    }).catch(console.error);
                },

                stopTracking: () => {
                    const { booking, pauseTracking } = get();
                    if (booking.activeTracking) {
                        pauseTracking();
                    }

                    // After pausing (which saves), we might want to mark the booking as closed or just leave it for the day.
                    // For now, let's just ensure it's saved.
                },

                initDb: async (conf: CouchDb) => {
                    try {
                        set({ bookingDbConf: conf });
                        const remoteDb = await remoteBookingDb(conf);
                        if (remoteDb) {
                            await syncBookingChanges(
                                remoteDb,
                                (err) => console.error('Sync error:', err),
                                () => console.log('Sync complete')
                            );
                        }

                        // Load initial data
                        const localDb = await getLocalBookingDb();
                        const result = await localDb.allDocs({ include_docs: true, descending: true });
                        const bookings = result.rows.map((row: any) => row.doc as IBooking);
                        set({ bookingList: bookings });

                        // Check if there is an active booking from today
                        const today = DateTime.now().toISODate();
                        const activeBooking = bookings.find((b: IBooking) =>
                            DateTime.fromISO(b.createdAt).toISODate() === today && !b.closed
                        );

                        if (activeBooking) {
                            get().setBooking(activeBooking);
                        }
                    } catch (error) {
                        console.error('Failed to initialize database:', error);
                        // Set empty list to prevent further errors
                        set({ bookingList: [] });
                    }
                }
            }),
            {
                name: 'time-tracking-storage',
                partialize: (state) => ({
                    bookingDbConf: state.bookingDbConf,
                    selectedBooking: state.selectedBooking
                }),
            }
        )
    )
);
