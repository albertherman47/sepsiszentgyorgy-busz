import type { Schedule } from '../../types/bus';

export const castelulSzentkeresztySchedules: Schedule[] = [
    // 10 → Casa cu Arcade / Lábasház
    {
        stopId: 'castelul-szentkereszty',
        lineId: 'line-10',

        direction: {
            hu: 'Lábasház',
            ro: 'Casa cu Arcade',
        },

        times: [
            '05:33', '06:33', '07:33', '08:33',
            '12:33', '13:33', '14:33', '15:33',
            '17:33', '18:33', '21:33',
        ],

        weekendTimes: [
            '06:33',
            '08:33',
            '12:33',
            '15:33',
            '17:33',
            '20:33',
        ],
    },
    
    // 10 → Arcuș / Árkos
    {
        stopId: 'castelul-szentkereszty',
        lineId: 'line-10',

        direction: {
            hu: 'Árkos',
            ro: 'Arcuș',
        },

        times: [
            '05:22',
            '06:22',
            '07:22',
            '08:22',
            '12:22',
            '13:22',
            '14:22',
            '15:22',
            '17:22',
            '18:22',
            '21:22',
        ],

        weekendTimes: [
            '06:22',
            '08:22',
            '12:22',
            '15:22',
            '17:22',
            '20:22',
        ],
    },
];
