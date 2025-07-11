import {createSerialExecutor} from "../src/serial-executor"

test('executor', async () => {
  const wait = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const executor = createSerialExecutor();
  const logs: number[] = [];
  const p1 =  executor.execute(async () => {
    await wait(100);
    logs.push(1);
    return 4;
  });
  const p2 = executor.execute(async () => {
    await wait(10);
    logs.push(2);
    return 5;
  });

  const [r1,r2] = await Promise.all([p1,p2]);
  expect(logs).toEqual([1, 2]);
  expect(r1).toEqual(4);
  expect(r2).toEqual(5);

});

test('sample', async () => {
  const wait = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const executor = createSerialExecutor();
  const p1 =  executor.execute(async () => {
    await wait(100);
    console.log("first queue");
    return 4;
  });
  const p2 = executor.execute(async () => {
    await wait(10);
    console.log("second queue");
    return 5;
  });

  const [r1,r2] = await Promise.all([p1,p2]);
  expect(r1).toEqual(4);
  expect(r2).toEqual(5);

});