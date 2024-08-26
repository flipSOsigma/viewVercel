import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { Timestamp, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Scan = () => {
  const navigate = useNavigate()
  // const [data, setData] = useState("")
  const [error, setError] = useState("")
  
  useEffect(()=> {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    const current = currentUser?.user?.email
    // setData(current)
    if(currentUser == null) {
      navigate("/login")
    }

    const onScanSuccess = (decodedText, decodedResult) => {
      addData(decodedText)
      html5QrcodeScanner.clear()
    }

    function formatFirestoreDateInIndonesian(date) {
      const options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',hour: 'numeric',
          minute: 'numeric',
          timeZone: 'Asia/Jakarta' 
      };
  
      const formatter = new Intl.DateTimeFormat('id-ID', options);
      return formatter.format(date);
    }  

    function getIndonesianWeekdayName(date) {
      const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const day = date.getDay();
      return weekdays[day];
    }    

    const addData = async (s) => {
      try {
        const sr = s.split("_")
        const subject = sr[0]
        const teacher = sr[1]

        let x;
        let z;
        let y;

        const i = query(collection(db, 'user'), where("email", "==", current))
        const q = await getDocs(i);
        q.forEach((doc) => {
          x = doc.data().email_wali
          y = doc.data().class
          z = doc.data().username
        })

        const hari = formatFirestoreDateInIndonesian(new Date())
        const addScanData = await addDoc(collection(db, "absen"), {
          email: current,
          scan_result: subject,
          teacher,
          class : y,
          timestamp: Timestamp.now(),
          waktu_absen: formatFirestoreDateInIndonesian(new Date()), 
          waktu_detail: { 
            hari: hari,
            days: new Date().getDay(),
            hour: new Date().getHours(),
            minute: new Date().getMinutes(),
            second: new Date().getSeconds(),
            day: new Date().getDate(),
            month: new Date().getMonth() + 1 
          }
        })

        axios
        .get("https://view-vercel.vercel.app", {
          params: {
            "email" : x,
            "subject" : `**Berhasil melakukan absensi pada pelajaran ${subject}**`,
            "message" : `ananda ${z} telah melakukan absesi pada mata pelajaran ${subject} pada tanggal ${hari}`,
          },
        })
        .then(() => {
          //success
          console.log("success");
        })
        .catch(() => {
          console.log("failure");
        });

        navigate("/")  
        console.log(addScanData)
      } catch(err) {
        console.log(err)
        setError(err)
      }
    }

    var html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} });
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  }, [])

  function formatFirestoreDateInIndonesian(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Jakarta' // Adjust if needed (see IANA time zones)
    };

    const formatter = new Intl.DateTimeFormat('id-ID', options);
    return formatter.format(date);
  }  

  function onScanFailure(error) {
    // console.warn(`Code scan error = ${error}`);
  }

  return (
    <div className="mx-auto text-sm max-w-screen-xl px-4 py-16 sm:px-6 min-h-screen flex flex-col lg:px-8 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')]">
      <div className="mx-auto max-w-lg text-center">
        {error ? (
          <div className="rounded-md text-white bg-black w-full p-3">{error}</div>
        ):(
          <div className="w-full rounded p-4"></div>
        )}
        <div className="w-full max-w-md rounded-md overflow-hidden">
        <div id="reader" className='w-full aspect-square'></div>
        </div>
      </div>
    </div>
  )
}

export default Scan
