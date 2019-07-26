export const to = function to(promise) {
    return promise
        .then(data => {
            return { err: null, data: data };
        })
        .catch(err => {
            return {
                err: err,
            };
        });
};
