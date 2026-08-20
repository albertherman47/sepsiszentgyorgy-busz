import { describe, it, expect } from 'vitest';
import { planTrip } from '../tripPlanner';
import type { Line, Schedule, Stop } from '../../types/bus';

// Helper to create stops spaced far apart (1 degree ~ 111km) to avoid accidental walking edges
const s = (id: string, latOffset: number): Stop => ({
    id, name_hu: id, name_ro: id, lat: 45 + latOffset, lng: 25, lineIds: []
});

const l = (id: string): Line => ({
    id, number: id, name_hu: id, name_ro: id, color: '#000', stopIds: [], path: []
});

const sch = (lineId: string, stopId: string, times: string[], direction: string = 'out'): Schedule => ({
    lineId, stopId, direction: { ro: direction, hu: direction }, times, weekendTimes: times
});

const defaultDate = new Date('2024-01-01T10:00:00'); // 10:00 AM

describe('tripPlanner', () => {
    
    it('1. should find a direct route', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L1', 'C', ['10:25']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts).toHaveLength(1);
        expect(opts[0].isDirect).toBe(true);
        expect(opts[0].transferCount).toBe(0);
        expect(opts[0].segments).toHaveLength(1);
        expect(opts[0].segments[0].line?.id).toBe('L1');
    });

    it('2. should find a route with one transfer', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L2', 'B', ['10:20']),
            sch('L2', 'C', ['10:30']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        expect(opts[0].isDirect).toBe(false);
        expect(opts[0].transferCount).toBe(1);
        expect(opts[0].segments).toHaveLength(2);
        expect(opts[0].segments[0].line?.id).toBe('L1');
        expect(opts[0].segments[1].line?.id).toBe('L2');
    });

    it('3. should find a route with two transfers', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3), s('D', 0.4)];
        const lines = [l('L1'), l('L2'), l('L3')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L2', 'B', ['10:20']),
            sch('L2', 'C', ['10:30']),
            sch('L3', 'C', ['10:35']),
            sch('L3', 'D', ['10:45']),
        ];

        const opts = planTrip('A', 'D', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        expect(opts[0].transferCount).toBe(2);
        expect(opts[0].segments).toHaveLength(3);
    });

    it('4. should retain a valid route even with a long wait time', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L2', 'B', ['11:15']), // 1 hour wait!
            sch('L2', 'C', ['11:30']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        expect(opts[0].totalWaitingMinutes).toBeGreaterThanOrEqual(60);
    });

    it('5. should reject impossible (too short) transfers and take the next bus', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            // The 10:16 bus leaves only 1 minute after arrival. Config min transfer is 2 mins.
            sch('L2', 'B', ['10:16', '11:00']),
            sch('L2', 'C', ['10:30', '11:15']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        // It must have taken the 11:00 bus, not the 10:16 bus.
        expect(opts[0].segments[1].departureTimeLabel).toBe('11:00');
    });

    it('6. should allow walking transfers between close stops', () => {
        // C is very close to B (~220 meters)
        // 1 deg lat = ~111km. 0.002 deg lat = 0.222km = 222m
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.202), s('D', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L2', 'C', ['10:30']),
            sch('L2', 'D', ['10:45']),
        ];

        const opts = planTrip('A', 'D', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        
        // Segments should be: L1, Walking, L2
        expect(opts[0].segments).toHaveLength(3);
        expect(opts[0].segments[1].isWalking).toBe(true);
        expect(opts[0].segments[1].fromStop.id).toBe('B');
        expect(opts[0].segments[1].toStop.id).toBe('C');
    });

    it('7. should return no routes if destination is completely unreachable', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3), s('D', 0.4)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L2', 'C', ['10:20']),
            sch('L2', 'D', ['10:30']),
        ];

        const opts = planTrip('A', 'D', defaultDate, schedules, lines, stops);
        expect(opts).toHaveLength(0);
    });

    it('8. should return multiple alternative routes sorted correctly (pareto optimality)', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3), s('D', 0.4)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            // Route 1 (L1): A -> B -> C 
            // Departs 10:15, Arrives 10:30 (travelTime from 10:00 = 30m)
            sch('L1', 'A', ['10:15']),
            sch('L1', 'B', ['10:20']),
            sch('L1', 'C', ['10:30']),
            
            // Route 2 (L2): A -> D -> C
            // Departs 10:05, Arrives 10:25 (travelTime from 10:00 = 25m)
            sch('L2', 'A', ['10:05']),
            sch('L2', 'D', ['10:15']),
            sch('L2', 'C', ['10:25']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(1);
        
        // L2 takes 25 mins total time from 10:00. L1 takes 30 mins. 
        // L2 should be ranked first. 
        // L1 is still pareto optimal because it departs later (10:15 vs 10:05).
        expect(opts[0].segments[0].line?.id).toBe('L2');
        expect(opts[1].segments[0].line?.id).toBe('L1');
    });

    it('9. should not needlessly transfer to the exact same line if it can stay on it', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'B', ['10:15']),
            sch('L1', 'C', ['10:25']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts).toHaveLength(1);
        expect(opts[0].transferCount).toBe(0);
        // It shouldn't create a segment A->B and another segment B->C on L1.
        expect(opts[0].segments).toHaveLength(1);
    });

    it('10. should consider multiple departure times if earlier bus leads to long wait', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05', '10:45']),
            sch('L1', 'B', ['10:15', '10:55']),
            // The connecting bus is at 11:00.
            // If I take the 10:05 bus, I wait 45 minutes at B.
            // If I take the 10:45 bus, I wait 5 minutes at B.
            sch('L2', 'B', ['11:00']),
            sch('L2', 'C', ['11:15']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        // We expect the option that takes the 10:45 bus to be considered better due to lower total wait time!
        const bestOpt = opts[0];
        expect(bestOpt.segments[0].departureTimeLabel).toBe('10:45');
    });

    it('11. should handle circular or returning routes without infinite loops', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1')];
        const schedules = [
            sch('L1', 'A', ['10:00']),
            sch('L1', 'B', ['10:10']),
            sch('L1', 'C', ['10:20']),
            sch('L1', 'A', ['10:30'], 'return'),
        ];

        // Ensure looking for A->C doesn't infinitely loop or return A->B->C->A->...
        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        expect(opts.length).toBeGreaterThan(0);
        expect(opts[0].segments[0].toStop.id).toBe('C');
    });

    it('12. should handle identical destination alternative routes correctly', () => {
        const stops = [s('A', 0.1), s('B', 0.2), s('C', 0.3)];
        const lines = [l('L1'), l('L2')];
        const schedules = [
            sch('L1', 'A', ['10:05']),
            sch('L1', 'C', ['10:25']),
            sch('L2', 'A', ['10:10']),
            sch('L2', 'C', ['10:30']),
        ];

        const opts = planTrip('A', 'C', defaultDate, schedules, lines, stops);
        // Both are direct routes. The first one arrives earlier and departs earlier.
        expect(opts).toHaveLength(2);
        expect(opts[0].segments[0].departureTimeLabel).toBe('10:05');
        expect(opts[1].segments[0].departureTimeLabel).toBe('10:10');
    });
});
