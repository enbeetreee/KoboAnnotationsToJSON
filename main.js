import sqlite3 from "sqlite3";
import fs, { write } from 'fs';

let sql = 'select title, chapterprogress, bookmark.contentid, bookmark.datecreated, text, annotation from bookmark left outer join content on (content.contentID=bookmark.VolumeID and content.ContentType=6) where text is not null;'


const fetchAll = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
};

let s = ""
let json = [];
if (fs.existsSync("./annotations.json")) {
    json = JSON.parse(fs.readFileSync("./annotations.json"));
}

if (!fs.existsSync('./KoboReader.sqlite')) {
    json.sort(sortNotes)
    console.log("No existe BDD, reordenando notas")
    writeJson()
} else {
    const db = new sqlite3.Database("KoboReader.sqlite", sqlite3.OPEN_READONLY)
    try {
        const data = await fetchAll(db, sql);
        readDBNotes(data)
    } catch (err) {
        console.log(err);
    } finally {

        try {
            db.close();
        } catch (error) {
            console.log(error)
        } finally {
            finishClose()

            json.forEach(e => {
                e.notes.sort(sortNotes)
            })
            writeJson();

        }


    }

}




function readDBNotes(data) {
    data.forEach(e => {
        if (json.findIndex(el => el.title == e.Title) == -1) {
            json.push({
                "title": e.Title,
                notes: []
            })
        }
        if (json[json.findIndex(el => el.title == e.Title)].notes.findIndex(note => note.text == e.Text) == -1) {

            if (e.Annotation && e.Annotation != '' && e.Annotation != "null") {
                json[json.findIndex(el => el.title == e.Title)].notes.push({
                    "date": e.DateCreated,
                    "text": e.Text,
                    "note": e.Annotation,
                    "chapter": e.ContentID,
                    "progress": e.ChapterProgress
                })
            } else {
                json[json.findIndex(el => el.title == e.Title)].notes.push({
                    "date": e.DateCreated,
                    "text": e.Text,
                    "chapter": e.ContentID,
                    "progress": e.ChapterProgress
                })
            }
        }


    });
}
function finishClose() {
    if (fs.existsSync("./KoboReader.sqlite-shm")) {
        fs.unlinkSync("./KoboReader.sqlite-shm")
        fs.unlinkSync("./KoboReader.sqlite-wal")
    }
}

function sortNotes(a, b) {
    if (a.chapter < b.chapter)
        return -1
    if (a.chapter > b.chapter)
        return 0

    if (!a.progress || !b.progress || a.progress == b.progress) {
        if (a.date < b.date) {
            return -1
        }
        if (a.date > b.date) {
            return 1
        }
        return 0
    }
    if (a.progress < b.progress) {
        return -1
    }
    return 1
}
function writeJson() {
    try {
        fs.writeFileSync("./annotations.json", JSON.stringify(json))
        console.log(new Date(Date.now()).toLocaleTimeString() + " - Hecho :)")
    } catch (error) {
        console.log(error.message)
    }
}