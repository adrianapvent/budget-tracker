let db;

const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending_transaction", {autoIncrement: true});
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        pushTransaction()
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode)
};

function saveRecord(record) {
    const transaction = db.transaction(["pending_transaction"], "readwrite");
    const storeTransaction = transaction.objectStore("pending_transaction");
    storeTransaction.add(record);
};

function pushTransaction() {
    const transaction = db.transaction(["pending_transaction"], "readwrite");
    const storeTransaction = transaction.objectStore("pending_transaction");
    const getAll = storeTransaction.getAll();

    getAll.onsuccess = function () {

        if (getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                  }
            })

            .then(response => response.json())

            .then(serverResponse => {

                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(["pending_transaction"], "readwrite");
                const storeTransaction = transaction.objectStore("pending_transaction");
                storeTransaction.clear();
            })

            .catch(err => console.log(err));
        }
    }
};

window.addEventListener("online", pushTransaction);