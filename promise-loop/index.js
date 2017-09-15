// ---------------------------------------------
// In a world where async/await is available...
// ---------------------------------------------
const myAsyncLoop = async () => {
  let done = false;
  while (!done) done = await countDown();
  // This implicitly returns a promise (since it's declared 'async')
  // and can be used correctly to determine when the operation has finished
};

// ---------------------------------------------
// In pre-async/await times...
// (watch out for incorrectly linking your exception handlers,
// or exceptions might get swallowed)
// ---------------------------------------------
const myAsyncLoop2 = () =>
  new Promise((resolve, reject) => {
    let promise = Promise.resolve();
    const iteration = () =>
      countDown()
        .then(done => {
          promise = done
            ? promise.then(resolve, reject)
            : promise.then(iteration, reject);
        })
        .catch(err => {
          reject(err);
        });
    promise = promise.then(iteration, reject);
  });

// ---------------------------------------------
// The iteration (same for both approaches)
// ---------------------------------------------
let credits = 0;

const countDown = () =>
  new Promise(resolve => {
    setTimeout(() => {
      if (credits === 0) {
        resolve(true);
        return;
      }
      console.log(credits);
      credits -= 1;
      resolve(false);
    }, 300);
  });

// ---------------------------------------------
// Running both
// ---------------------------------------------
Promise.resolve()
  .then(() => {
    credits = 5;
    return myAsyncLoop().then(() => {
      console.log('...and lift-off!');
    });
  })
  .then(() => {
    credits = 5;
    return myAsyncLoop2().then(() => {
      console.log('...and lift-off!');
    });
  })
  .catch(err => {
    console.error(err);
  });
