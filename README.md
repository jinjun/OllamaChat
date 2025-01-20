# OllamaChat

This is a project developed for me to learn AI coding. But the repo does contain a fully functional local Ollama chat interface that includes the following features as of today:

1. Chat through locally installed Ollama and Ollama API
2. Submit local image file or paste an image url to Ollama API and get results from a Multi-modality LLM model
3. Speech-to-text as input from you mic
4. Text-to-speech to readout the output from Ollama
5. List of messages sent to Ollama and reply them anytime later
6. Tune some of the kee parameters

## Background

I started by using `Cursor` to under how well those AI coding programs can do today. `Cursor` is amazing but just not good enough for the price. Hence I switched to `Cline` as an extension to `Visual Studio Code`. In `Cline` I entered my `DeepSeek` API key. Everything works like a charm. 

## How to install

Creating a web-based app is very straightforward. But when I test tun the very first version of OllamaChat, the cross origin request from javascript was blocked. Since I'm not going to modify anything comes with standard Ollama installation, I ended up installing a local nginx server that could add necessary CORS header to bypass the `Access-Control-Allow-Origin` requirement. That said, a typical Ollama API call goes to http://localhost::11434, while I put my agent server at http://localhost::11435. The agent is able to redirect the API request to the Ollama API. Therefore, to install the repo, you need:

1. clone the repo
2. install Ollama
3. install nginx and run it with the configuration in this repo's `conf` folder
4. Open `index.html` in your browser and go from there

## Issues with AI coder

`DeepSeek v3` is what I'm using so far, because all benchmarks say it's the best as of today. Programming-wise it is amazing at setting up the necessary file structure, implementing the initial functionality, writing those detailed css code, etc. But issues I found includes:

1. Sometimes when some new functions are added, many old functions may break. So testing becomes more intensive
2. Describing the requirement needs to be precise especially when the code scale grows large
3. The programmer still needs a fairly good understanding of the programming language, or you have to compromise when certain requirement just cannot be implemented in your expected way
4. If you can look at the code and do it yourself, sometimes it is way faster than entering multiple round of instructions

I never believe anyone without programming knowledge can just use AI coder to develop serious program. There is a long way for AI to improve ...

## Date
Jan. 20, 2025
