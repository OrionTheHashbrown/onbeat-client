/**
 * TEMPO PLAN TESTS – lib/tempo/__tests__/plan.test.ts
 *
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { type Adjustment, buildTempoPlan, getTargetBpmAt } from '../plan';

describe('buildTempoPlan', () => {
  it('should make 4 stages in order: warm up, build, peak, cool down', () => {
    const plan = buildTempoPlan(30);

    const stageIds = plan.map((stage) => stage.id);
    assert.deepStrictEqual(stageIds, ['warmup', 'build', 'peak', 'cooldown']);
  });

  it('should leave no gaps and end EXACTLY on the goal', () => {
    const plan = buildTempoPlan(30);

    // CHECK each stage starts right where the one before it ended
    assert.strictEqual(plan[0].startMs, 0);
    for (let index = 1; index < plan.length; index++) {
      assert.strictEqual(plan[index].startMs, plan[index - 1].endMs);
    }

    // 30 minutes = 1,800,000 ms, not a millisecond more or less
    assert.strictEqual(plan[plan.length - 1].endMs, 30 * 60 * 1000);
  });

  it('should set each target from the usual cadence + the stage offset', () => {
    const plan = buildTempoPlan(30, 155);

    const targets = plan.map((stage) => stage.targetBpm);
    assert.deepStrictEqual(targets, [135, 155, 172, 120]);
  });

  it('should keep every target between 110 and 200', () => {
    const slowPlan = buildTempoPlan(30, 100);
    for (const stage of slowPlan) {
      assert.ok(stage.targetBpm >= 110, stage.name + ' is below 110');
    }

    // A very fast one would put peak at 217, so it gets pulled down to 200
    const fastPlan = buildTempoPlan(30, 200);
    for (const stage of fastPlan) {
      assert.ok(stage.targetBpm <= 200, stage.name + ' is above 200');
    }
  });
});

describe('getTargetBpmAt', () => {
  const plan = buildTempoPlan(30, 155);
  const middleOfBuild = 10 * 60 * 1000; // build runs from about 4:17 to 17:08

  it('should be the planned target when the coach has changed nothing', () => {
    assert.strictEqual(getTargetBpmAt(plan, [], middleOfBuild), 155);
  });

  it('should never go more than 10% below the plan', () => {
    // 5 "struggling" changes of -10 BPM each = -50 BPM, way past the 10% limit
    const bigChanges: Adjustment[] = [];
    for (let count = 0; count < 5; count++) {
      bigChanges.push({ atMs: 1000, deltaBpm: -10, reason: 'struggling', stageId: 'build' });
    }

    // 10% below 155 = 139.5, rounded to 140
    assert.strictEqual(getTargetBpmAt(plan, bigChanges, middleOfBuild), 140);
  });
});
