

# Serial Execute async functions

### install

``` 
npm i @9wick/serial-exeecutor
```


### How to use

```typescript

  import {createSerialExecutor} from "@9wick/serial-executor"
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

```

