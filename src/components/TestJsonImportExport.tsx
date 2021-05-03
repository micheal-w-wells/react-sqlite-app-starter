import React, { useState, useEffect, useCallback, useRef } from "react";
import "./TestJsonImportExport.css";
import { IonCard, IonCardContent } from "@ionic/react";
import {
  dataToImport,
  IAPP_Import,
  IAPP_Import_Partial,
  partialImport1,
} from "../Utils/importJsonUtils";

import { sqlite, isJsonListeners } from "../App";
import { SQLiteDBConnection } from "react-sqlite-hook/dist";
import { deleteDatabase } from "../Utils/deleteDBUtil";
import { Dialog } from "@capacitor/dialog";

const TestJsonImportExport: React.FC<any> = (props) => {
  const [log, setLog] = useState<string[]>([]);
  const errMess = useRef("");
  const showAlert = async (message: string) => {
    await Dialog.alert({
      title: "Error Dialog",
      message: message,
    });
  };
  /**
   * testFullImportFromJson
   */
  const testFullImportFromJson = async (): Promise<boolean> => {
    setLog((log) => log.concat("* Starting testFullImportFromJson *\n"));
    try {
      // test the plugin with echo
      let res: any = await sqlite.echo("Hello from echo");
      if (res.value !== "Hello from echo") {
        errMess.current = `Echo not returning "Hello from echo"`;
        return false;
      }
      setLog((log) => log.concat("> Echo successful\n"));
      // test Json object validity
      res = await sqlite.isJsonValid(JSON.stringify(dataToImport));
      if (!res.result) {
        errMess.current = `isJsonValid is returning false `;
        return false;
      }
      setLog((log) => log.concat("> isJsonValid successful\n"));

      // test import from Json Object
      res = await sqlite.importFromJson(JSON.stringify(dataToImport));

      log.concat("number of imports to run: " + props.testsToRun + " \n");
      log.concat("build cache or not");
      for (let i = 0; i < 1000; ) {
      res = await sqlite.importFromJson(JSON.stringify(dataToImport));
      log.concat("importing json\n");
      }
      console.log(`full import result ${res.changes.changes}`);
      if (res.changes.changes === -1) {
        errMess.current = `importFromJson changes < 0 `;
        return false;
      }
      setLog((log) => log.concat("> importFromJson successful\n"));

      // create a connection for "db-from-json"
      let db: SQLiteDBConnection = await sqlite.createConnection(
        "db-from-json",
        false,
        "no-encryption",
        1
      );
      setLog((log) =>
        log.concat("> createConnection " + " 'db-from-json' successful\n")
      );
      // open db "db-from-json"
      await db.open();
      setLog((log) => log.concat("> open " + " 'db-from-json' successful\n"));
      // create synchronization table
      res = await db.createSyncTable();
      if (res.changes.changes < 0) {
        errMess.current = `createSyncTable changes < 0 `;
        return false;
      }
      setLog((log) =>
        log.concat("> createSyncTable " + " 'db-from-json' successful\n")
      );
      // get the synchronization date
      res = await db.getSyncDate();
      if (res.syncDate === 0) {
        errMess.current = `getSyncDate return 0 `;
        return false;
      }
      console.log("$$ syncDate " + res.syncDate);
      setLog((log) =>
        log.concat("> getSyncDate " + " 'db-from-json' successful\n")
      );
      // select all users in db
      res = await db.query("SELECT count(*) FROM users;");
      setLog((log) =>
        log.concat("> points:  " + JSON.stringify(res.values[0]) + " \n")
      );
      // close the connection
      await sqlite.closeConnection("db-from-json");
      setLog((log) => log.concat("> closeConnection successful\n"));
      setLog((log) => log.concat("* Ending testFullImportFromJson *\n"));
      return true;
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }
  };

  const loadTest = async (): Promise<boolean> => {
    try {
      let res: any = await sqlite.isJsonValid(JSON.stringify(IAPP_Import));

      setLog((log) => log.concat("* Starting load test  - create db*\n"));
      //    for (let i = 0; i < 100; i++) {
      await sqlite.importFromJson(JSON.stringify(IAPP_Import));
      //   }

      let db: SQLiteDBConnection = await sqlite.createConnection(
        "db-from-iapp",
        false,
        "no-encryption",
        1
      );
      setLog((log) =>
        log.concat("> createConnection " + " 'iappdb' successful\n")
      );
      let x = 1;
      setLog((log) =>
        log.concat("* Starting load test  - inserting " + x + " records*\n")
      );

      //for(let i = 0; i < x; i++){
      setLog((log) => log.concat("* Starting load test  - validating*\n"));
      res = await sqlite.isJsonValid(JSON.stringify(IAPP_Import_Partial));
      setLog((log) => log.concat("* Starting load test  - importing*\n"));
      await sqlite.importFromJson(JSON.stringify(IAPP_Import_Partial));
      setLog((log) => log.concat("* Starting load test  - validated*\n"));
      // }

      // open db "db-from-json"
      await db.open();
      // select all users in db
      res = await db.query("SELECT count(*) FROM iapp;");
      setLog((log) =>
        log.concat(
          "* complete load test, now " + res?.values?.length + " records*\n"
        )
      );
    } catch (e) {
      setLog((log) => log.concat("* failed load test  " + JSON.stringify(e)));

      return false;
    }
    return true;
  };
  /**
   * testPartialImportFromJson
   */
  const testPartialImportFromJson = async (): Promise<boolean> => {
    setLog((log) => log.concat("* Starting testPartialImportFromJson *\n"));
    try {
      // test Json object validity
      let res: any = await sqlite.isJsonValid(JSON.stringify(partialImport1));
      if (!res.result) {
        errMess.current = `isJsonValid Partial is returning false `;
        return false;
      }
      setLog((log) => log.concat("> isJsonValid successful\n"));
      // partial import
      //for(let i = 0; i < 100000; i++)
      res = await sqlite.importFromJson(JSON.stringify(partialImport1));
      setLog((log) => log.concat("> partial works\n"));
      if (res.changes.changes === -1) {
        errMess.current = `importFromJson Partial changes < 0 `;
        return false;
      }
      setLog((log) => log.concat("> importFromJson successful\n"));
      // create a connection for "db-from-json"
      let db: SQLiteDBConnection = await sqlite.createConnection(
        "db-from-json",
        false,
        "no-encryption",
        1
      );
      setLog((log) =>
        log.concat("> createConnection " + " 'db-from-json' successful\n")
      );
      // open db "db-from-json"
      await db.open();
      setLog((log) => log.concat("> open " + " 'db-from-json' successful\n"));
      // select all users in db
      res = await db.query("SELECT * FROM users;");
      if (res.values.length < 1) {
        errMess.current = `Query users not returning 1 values`;
        return false;
      }
      setLog((log) => log.concat("> query " + " 'users' successful\n"));

      // select all messages in db
      res = await db.query("SELECT * FROM messages;");
      if (
        res.values.length !== 4 ||
        res.values[0].title !== "test post 1" ||
        res.values[1].title !== "test post 2" ||
        res.values[2].title !== "test post 3" ||
        res.values[3].title !== "test post 4"
      ) {
        errMess.current = `Query messages not returning 4 values`;
        return false;
      }
      setLog((log) => log.concat("> query " + " 'messages' successful\n"));

      // select all images in db
      res = await db.query("SELECT * FROM images;");
      if (
        res.values.length !== 2 ||
        res.values[0].name !== "feather" ||
        res.values[1].name !== "meowth"
      ) {
        errMess.current = `Query images not returning 2 values`;
        return false;
      }
      setLog((log) => log.concat("> query " + " 'images' successful\n"));
      // close the connection
      await sqlite.closeConnection("db-from-json");
      setLog((log) => log.concat("> closeConnection successful\n"));
      setLog((log) => log.concat("* Ending testPartialImportFromJson *\n"));
      return true;
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }
  };
  /**
   * testImportFromJson
   */
  const testImportFromJson = useCallback(async (): Promise<boolean> => {
    setLog((log) => log.concat("** Starting testImportFromJson **\n"));
    loadTest();

    let ret: boolean = false;
    ret = await testFullImportFromJson();
    if (!ret) {
      setLog((log) => log.concat("* testFullImportFromJson  failed*\n"));
      return false;
    }
    ret = await testPartialImportFromJson();
    if (!ret) {
      setLog((log) => log.concat("* testPartialImportFromJson  failed*\n"));
      return false;
    }
    setLog((log) => log.concat("** Ending testImportFromJson **\n\n"));
    return true;
  }, []);
  /**
   * testFullExportToJson
   */
  const testFullExportToJson = async (
    db: SQLiteDBConnection
  ): Promise<boolean> => {
    setLog((log) => log.concat("* Starting testFullExportToJson *\n"));
    try {
      // export to json full
      setLog((log) => log.concat("attempting to export to json"));
      let jsonObj: any = await db.exportToJson("full");
      // test Json object validity
      let res: any = await sqlite.isJsonValid(JSON.stringify(jsonObj.export));
      if (!res.result) {
        setLog((log) => log.concat(`> isJsonValid ${res.message}\n`));
        errMess.current = `isJsonValid Full returns false`;
        return false;
      }
      setLog((log) => log.concat("> Export Full Json Object is valid\n"));
      setLog((log) => log.concat("* Ending testFullExportToJson \n"));
      return true;
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }
  };
  /**
   * testPartialExportToJson
   */
  const testPartialExportToJson = async (
    db: SQLiteDBConnection
  ): Promise<boolean> => {
    setLog((log) => log.concat("* Starting testPartialExportToJson *\n"));
    try {
      // Set the synchronization date
      await db.setSyncDate("2020-05-20T18:40:00.000Z");
      setLog((log) => log.concat("> setSyncDate successful\n"));
      // export to json partial
      let jsonObj: any = await db.exportToJson("partial");
      // test Json object validity
      let res: any = await sqlite.isJsonValid(JSON.stringify(jsonObj.export));
      if (!res.result) {
        setLog((log) => log.concat(`> isJsonValid ${res.message}\n`));
        errMess.current = `isJsonValid Partial returns false`;
        return false;
      }
      setLog((log) => log.concat("> Export Json Object is valid\n"));
      if (
        jsonObj.export.tables.length !== 3 ||
        jsonObj.export.tables[0].name !== "users" ||
        jsonObj.export.tables[1].name !== "messages" ||
        jsonObj.export.tables[2].name !== "images" ||
        jsonObj.export.tables[0].values.length !== 4 ||
        jsonObj.export.tables[1].values.length !== 3 ||
        jsonObj.export.tables[2].values.length !== 1
      ) {
        errMess.current = "Export Partial tables.length != 3";
        return false;
      }
      setLog((log) => log.concat("> Export  Partial Json Object successful\n"));
      setLog((log) => log.concat("* Ending testPartialExportToJson \n"));
      return true;
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }
  };
  /**
   * testExportToJson
   */
  const testExportToJson = useCallback(async (): Promise<boolean> => {
    setLog((log) => log.concat("** Starting testExportToJson **\n"));
    let db: SQLiteDBConnection;
    try {
      // create a connection for "db-from-json"
      db = await sqlite.createConnection(
        "db-from-json",
        false,
        "no-encryption",
        1
      );
      setLog((log) =>
        log.concat("> createConnection " + " 'db-from-json' successful\n")
      );
      // open db "db-from-json"
      await db.open();
      setLog((log) => log.concat("> open " + " 'db-from-json' successful\n"));
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }

    let res: boolean = await testFullExportToJson(db);
    if (!res) {
      setLog((log) => log.concat("* testFullExportToJson  failed*\n"));
      return false;
    }
    res = await testPartialExportToJson(db);
    if (!res) {
      setLog((log) => log.concat("* testPartialExportToJson  failed*\n"));
      return false;
    }
    try {
      // Delete "db-from-json" for multiple successive tests
      // delete it for multiple successive tests
      await deleteDatabase(db);
      setLog((log) => log.concat("* deleteDatabase failed*\n"));
      // close the connection
      sqlite.closeConnection("db-from-json");

      setLog((log) => log.concat("** Ending testExportToJson **\n"));

      return true;
    } catch (err) {
      errMess.current = `${err.message}`;
      return false;
    }
  }, [errMess]);
  /**
   * useEffect
   */

  useEffect(() => {
    if (sqlite.isAvailable) {
      // delete it for multiple successive tests

      testImportFromJson().then(async (res) => {
        if (res) {
          testExportToJson().then((res) => {
            if (res) {
              setLog((log) =>
                log.concat("\n* The set of tests was successful *\n")
              );
            } else {
              setLog((log) => log.concat("\n* The set of tests failed *\n"));
            }
          });
        } else {
          setLog((log) => log.concat("\n* The set of tests failed *\n"));
          await showAlert(errMess.current);
        }
      });
    } else {
      sqlite.getPlatform().then((ret: { platform: string }) => {
        setLog((log) =>
          log.concat("\n* Not available for " + ret.platform + " platform *\n")
        );
      });
    }
  }, [errMess, testExportToJson, testImportFromJson]);

  return (
    <IonCard className="container-import-export">
      <IonCardContent>
        <pre>
          <p>{log}</p>
        </pre>
        {errMess.current.length > 0 && <p>{errMess.current}</p>}
      </IonCardContent>
    </IonCard>
  );
};

export default TestJsonImportExport;
