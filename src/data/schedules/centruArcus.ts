import type { Schedule } from '../../types/bus';

export const centruArcusSchedules: Schedule[] = [
    // ============================================================
    // 10 → Casa cu Arcade / Lábasház
    // ============================================================
    {
        stopId: 'centru-arcus',
        lineId: 'line-10',

        direction: {
            hu: 'Lábasház',
            ro: 'Casa cu Arcade',
        },

        times: [
            '05:30',
            '06:30',
            '07:30',
            '08:30',
            '12:30',
            '13:30',
            '14:30',
            '15:30',
            '17:30',
            '18:30',
            '21:30',
        ],

        weekendTimes: [
            '06:30',
            '08:30',
            '12:30',
            '15:30',
            '17:30',
            '20:30',
        ],
    },
];
