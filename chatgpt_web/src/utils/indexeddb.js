/**
 * 打开数据库
 * @param {String} dbName 数据库名
 * @param {Object} stores 表列表
 * @param {Number} version 版本号
 * @returns {Promise}
 */
export function initDB(dbName, stores = [], version = 1) {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(dbName, version);
		request.onerror = function (event) {
			reject(new Error(event.target.error.message));
		};
		request.onupgradeneeded = function (event) {
			let db = event.target.result;
			stores.forEach(
				({ storeName, keyPath, indexes = [], autoIncrement = false }) => {
					// 为该数据库创建一个对象仓库
					if (!db.objectStoreNames.contains(storeName)) {
						const objectStore = db.createObjectStore(storeName, {
							keyPath,
							autoIncrement,
						});
						if (indexes.length) {
							indexes.forEach((v) => {
								objectStore.createIndex(v.name, v.key, v.options);
							});
						}
					}
				}
			);
		};
		request.onsuccess = function (event) {
			resolve(event.target.result);
		};
	});
}

/**
 * 添加数据
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {Array<Object>} rows 数据列表
 * @returns {Promise}
 */
export function insertRows(db, storeName, rows = []) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readwrite');
		transaction.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
		transaction.oncomplete = function () {
			resolve();
		};
		const objectStore = transaction.objectStore(storeName);
		rows.forEach((row) => {
			// put表示存在时修改，不存在时新增
			objectStore.put(row);
		});
	});
}

/**
 * 删除数据
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} keyValue 键值
 * @returns {Promise}
 */
export function removeRowByKey(db, storeName, keyValue) {
	return new Promise((resolve, reject) => {
		const request = db
			.transaction([storeName], 'readwrite')
			.objectStore(storeName)
			.delete(keyValue);
		request.onsuccess = function () {
			resolve(true);
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 根据查询条件删除
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} param2
 * @returns
 */
export function removeRowsByCursor(db, storeName, { key, query }) {
	return new Promise((resolve, reject) => {
		const objectStore = db
			.transaction([storeName], 'readwrite')
			.objectStore(storeName);
		const request = objectStore.index(key).openCursor(query);
		request.onsuccess = function () {
			const cursor = request.result;
			if (cursor) {
				cursor.delete();
				cursor.continue();
			} else {
				resolve(true);
			}
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 清空记录
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @returns 
 */
export function clearRows(db, storeName) {
	return new Promise((resolve, reject) => {
		const objectStore = db
			.transaction([storeName], 'readwrite')
			.objectStore(storeName);
		const request = objectStore.clear();
		request.onsuccess = function () {
			resolve(true);
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 更新记录
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {Object} row 新记录
 * @returns {Promise}
 */
export function updateRow(db, storeName, row) {
	return new Promise((resolve, reject) => {
		const request = db
			.transaction([storeName], 'readwrite')
			.objectStore(storeName)
			.put(row);
		request.onsuccess = function () {
			resolve(true);
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 根据主键查询
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} keyValue 键值
 * @returns {Promise}
 */
export function findRowByKey(db, storeName, keyValue) {
	return new Promise((resolve, reject) => {
		const request = db
			.transaction([storeName])
			.objectStore(storeName)
			.get(keyValue);
		request.onsuccess = function () {
			resolve(request.result);
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 获取所有记录
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @returns {Promise}
 */
export function findAllRows(db, storeName) {
	return new Promise((resolve, reject) => {
		const request = db.transaction([storeName]).objectStore(storeName).getAll();
		request.onsuccess = function () {
			resolve(request.result);
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 根据索引查询
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} indexKey 索引键
 * @param {*} indexValue 索引值
 * @returns {Promise}
 */
export function findRowByIndex(db, storeName, indexKey, indexValue) {
	return new Promise((resolve, reject) => {
		const request = db
			.transaction([storeName])
			.objectStore(storeName)
			.index(indexKey)
			.openCursor(IDBKeyRange.only(indexValue));
		const result = [];
		request.onsuccess = function () {
			const cursor = request.result;
			if (cursor) {
				result.push(cursor.value);
				cursor.continue();
			} else {
				resolve(result);
			}
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 分页条件查找
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 */
export function findRowsByKeyCursor(
	db,
	storeName,
	{ key, query, direction = 'next', offset, limit }
) {
	return new Promise((resolve, reject) => {
		const objectStore = db.transaction([storeName]).objectStore(storeName);
		const request = objectStore.index(key).openCursor(query, direction);
		const result = [];
		request.onsuccess = function () {
			const cursor = request.result;
			if (cursor) {
				if (!result.length) {
					cursor.advance(offset);
				} else if (result.length >= limit) {
					resolve(result);
				} else {
					result.push(cursor.value);
					cursor.continue();
				}
			} else {
				resolve(result);
			}
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 从主键值分页
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} param2
 * @returns
 */
export function findRowsByKeyCursorOffsetFromPrimaryKeyValue(
	db,
	storeName,
	{ key, query, direction = 'next', limit, primaryKeyValue }
) {
	return new Promise((resolve, reject) => {
		const objectStore = db.transaction([storeName]).objectStore(storeName);
		const request = objectStore.index(key).openCursor(query, direction);
		const result = [];
		// 是否有效数据
		let startPush = false;
		request.onsuccess = function () {
			const cursor = request.result;
			if (cursor) {
				if (result.length >= limit) {
					return resolve({
						result,
						lastKeyValue: cursor.primaryKey,
						hasMore: true,
					});
				} else {
					if (!primaryKeyValue || startPush) {
						result.push(cursor.value);
					}
					if (cursor.primaryKey === primaryKeyValue) {
						startPush = true;
					}
					cursor.continue();
				}
			} else {
				resolve({ result, lastKeyValue: -1, hasMore: false });
			}
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 根据索引查找最后一条记录
 * @param {IDBDatabase} db 数据库引用
 * @param {String} storeName 表名
 * @param {*} param2
 * @returns
 */
export async function findLastRowByIndex(db, storeName, { key, query }) {
	return new Promise((resolve, reject) => {
		const objectStore = db.transaction([storeName]).objectStore(storeName);
		const request = objectStore.index(key).openCursor(query, 'prev');
		request.onsuccess = function () {
			const cursor = request.result;
			if (cursor) {
				resolve(cursor.value);
			} else {
				resolve(null);
			}
		};
		request.onerror = function (e) {
			reject(new Error(e.target.error.message));
		};
	});
}

/**
 * 关闭数据库
 * @param {IDBDatabase} db 数据库引用
 */
export function closeDB(db) {
	db.close();
}

/**
 * 导出数据库数据成json格式
 * @param {IDBDatabase} db 数据库引用
 * @returns
 */
export async function exportDBDataAsJSON(db) {
	const storeNames = Array.from(db.objectStoreNames);
	const result = {};
	for (let store of storeNames) {
		result[store] = await findAllRows(db, store);
	}
	return result;
}

/**
 * 导入json文件到数据库
 * @param {IDBDatabase} db 数据库引用
 * @param {Object} json 数据
 */
export async function importDBData(db, json) {
	const storeNames = Array.from(db.objectStoreNames);
	for (let store of storeNames) {
		if (json[store] && json[store].length) {
			await insertRows(db, store, json[store]);
		}
	}
}