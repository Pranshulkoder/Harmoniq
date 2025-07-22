
let currentSong = new Audio();
let songs;
let currFolder;

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    // console.log(response);

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; //clear previous songs
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML +
            `<li data-song="${song}">
                  <img src="assets/music.svg" alt="" class="invert" width="24px">
                  <div class="info">
                      <div>  ${song.replaceAll(/%20|%5[0-9A-Fa-f]|%2/g, " ")}
 </div>
    <div>pranshul</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="assets/play.svg" alt="" class="invert" width="24px ">
                </div>
            </li>`;
    }
    return songs; 
}
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track
    if (!pause) {
        currentSong.play();
        play.src = "assets/paused.svg";
    }
    // document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songinfo").innerHTML = track.replaceAll(/%20|%5[0-9A-Fa-f]|%2/g, " ");
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

async function displayAlbums(){
    console.log("displaying albums")

    let a = await fetch("/songs/")
    let response = await a.text();
    console.log(response);

    let div = document.createElement("div")
    div.innerHTML = response;

    let anchors = div.querySelectorAll("a.icon.icon-directory");
    let folders = [];
    for (let a of anchors) {
        let href = a.getAttribute("href");
        // Skip parent folder and breadcrumb
        if (href === "/" || href === "/songs" || href === "/songs/") continue;
        // Get the folder name from href
        let folder = href.split("/").filter(Boolean).pop(); // e.g., "004", "cs"
        folders.push(folder);
    }
    console.log("Folders found:", folders);

    let cardContainer = document.querySelector(".CardContainer")

     // Loop through folders and try to fetch info.json
    for (let folder of folders) {
        try {
            let infoRes = await fetch(`songs/${folder}/info.json`);
            if (!infoRes.ok) {
                console.warn(`Missing or bad /songs/${folder}/info.json`);
                continue;
            }
            let meta = await infoRes.json();
            // Append card to container
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="maroon" />
<g transform="translate(6.5, 6) scale(0.5)">
<path d="M5 20V4L19 12L5 20Z" stroke="#000000" fill="#000000" stroke-width="1.1" stroke-linejoin="round" /></g>
</svg>

                    </div>
                    <img src="songs/${folder}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>`;
        } catch (err) {
            console.error(`Error processing folder ${folder}`, err);
        }
    }

    //add event listener for playlist updating
    Array.from(document.querySelectorAll(".card")).forEach(e => {
        e.addEventListener("click", async item => {
            currFolder = item.currentTarget.dataset.folder;
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]); 
        });
    });

}

async function main() {
    await getSongs("songs/ncs");
    console.log(songs);
    playMusic(songs[0], true); //play first song by default

    //display all albums in the page
    displayAlbums();

     //attach event listeners to songs
     Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info div").innerHTML.trim());
        });
    }); 
    
    //attach event listeners to play now
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "assets/paused.svg";
        }
        else {
            currentSong.pause();
            play.src = "assets/play.svg";
        }
    });
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0 || seconds === Infinity) {
            return "00:00";
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const paddedSecs = secs < 10 ? '0' + secs : secs;
        return `${mins}:${paddedSecs}`;
    }
    //lisren to time update
    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = formatTime(currentSong.currentTime) + "/" + formatTime(currentSong.duration);
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration * 100) + "%";

    })
    //add an event listener to the seek bar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;

    });
    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0px";
    });
    //add event listener for close button for closing the left panel
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    //add event listener for previous and next buttons
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    let val1;
    //add event listener for volume control
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("input", (e) => {
        val1 = parseInt(e.target.value)/100;
        currentSong.volume = val1;
    });

    //add event listener for mute button
    document.querySelector(".volume>img").addEventListener("click", e => {
        console.log(e.target);
        if(e.target.src.endsWith("volume.svg")){
            e.target.src = e.target.src.replace("volume", "mute"); 
            currentSong.muted = true;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("mute", "volume");
            currentSong.muted = false;
            document.querySelector(".range").getElementsByTagName("input")[0].value = val1*100;
        }
    });
}
main();