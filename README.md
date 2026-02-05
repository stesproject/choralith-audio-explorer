# Choralith Audio Explorer

Choralith Audio Explorer is a software tool designed to help you efficiently manage your libraries of audio files, including both sound effects and music. It is specifically tailored to assist in finding the perfect tracks for games or any other project.

<img src="res/app_preview.gif" alt="Choralith Audio Explorer preview" width="800"/>

## Features 🌟

- **Asynchronous subfolder scanning:** select a main directory, and the app will scan for any audio files within, even if there is a very large number of files.

- **Wide format support:** compatible with .mp3, .wav, .ogg, and .flac file formats.

- **Metadata display:** presents audio files in a minimalistic and clean table, displaying the title, artist, album, and length of each track.

- **Easy track control and navigation:** click on a track to start playing it, scroll through tracks using arrow keys, and press Enter to start or stop playback.

- **Easy export:** click on the "Open Directory" button to quickly access the directory at the file path.

- **Favorites System:** mark tracks as favorites and toggle the view to see only your favorite files.

- **Smart Caching:** subsequent scans of the same folder are instant thanks to a local caching system using IndexedDB.

- **Pitch Control:** adjust the pitch (and playback speed) of the audio in real-time, useful for previewing how a sound effect might sound with pitch shifting.

- **Column-specific filtering:** filter by keyword directly within each column, allowing filtering by title, artist, or album.

## Installation 🛠️

To run the program, follow these steps:

1. Clone the repository to your local machine
2. Navigate into the program directory
3. Open a terminal and run the following command to install the required dependencies:

`npm install`

4. Still in the terminal, start the program by running:

`npm run dev`

NOTE: you also need Node.js installed on your machine.

## Shortcuts ⌨️

- **Arrow Up / Arrow Down**: navigate tracks
- **Enter**: start / stop playback
- **Arrow Left / Arrow Right**: rewind / forward 10s
- **Shift + Arrow Left / Arrow Right**: decrease / increase pitch
- **1**: reset pitch
- **L**: toggle loop

## What's Next 🔮

I would like to enhance the program with the following useful features:

- **Column sorting**: enable sorting of columns alphabetically and by track length.

- **Project grouping**: allow users to group files into specific "projects" for streamlined management and easy export in the future.

## Contributing 🤝

Contributions are highly welcome!

If you would like to enhance the program or add new features, your contributions would be greatly appreciated!

Please check the open issues for more details.
