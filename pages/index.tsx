import Head from "next/head"
import { Layout } from "@/components/layout"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Lightbulb, Copy, Check } from "lucide-react"

import { useState } from 'react';

let OPENAI_API_KEY;
let openai;
if (process.browser) {
   // on browser
  const { Configuration, OpenAIApi } = require("openai");
  OPENAI_API_KEY = getParameterByName('openai_api_key') || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}
const Cosmic = require("cosmicjs")
const api = Cosmic()

function getParameterByName(name, url = '') {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function str2br(str) {
  return str.trim().replace(/(?:\r\n|\r|\n)/g, '<br>')
}
function H2(text) {
  return (
    <h2 className="mt-10 mb-2 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-slate-700">
      {text.children}
    </h2>
  )
}



export default function IndexPage() {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [status, setStatus] = useState('typing');
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState('');
  const [addingToCosmic, setAddingToCosmic] = useState(false);
  
  /* Prompts
  Headless CMS
  Write a 500 word article about why using a headless CMS may be a better choice than wordpress for building modern websites.

  React CMS
  Write a 5 paragraph article that ranks for seo for react cms that discusses why Cosmic CMS is the best content management system for your react applications. Use a brief code example from https://docs.cosmicjs.com
  */
  // if (error) {
  //   alert(error)
  // }

  async function handleAddToCosmic(e) {
    setAddingToCosmic(true)
    const bucket = api.bucket({
      slug: getParameterByName('bucket_slug') || process.env.NEXT_PUBLIC_COSMIC_BUCKET_SLUG,
      read_key: getParameterByName('read_key') || process.env.NEXT_PUBLIC_COSMIC_BUCKET_READ_KEY,
      write_key: getParameterByName('write_key') || process.env.NEXT_PUBLIC_COSMIC_BUCKET_WRITE_KEY,
    })
    console.log('sending')
    const post = {
      title: prompt,
      content: str2br(answer),
      type: getParameterByName('type') || 'posts'
    }
    try {
      const added = await bucket.objects.insertOne(post)
      console.log('Added!', added)
      setAddingToCosmic(false)
    } catch (err) {
      console.log(err)
      setAddingToCosmic(false)
    }
  }

  async function resetForm(e) {
    setStatus('');
    setPrompt('');
    setError(false);
    setErrorMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim())
      return;
    setStatus('submitting');
    try {
      await submitForm(prompt);
      setStatus('success');
    } catch (err) {
      setStatus('typing');
      setError(err);
    }
  }

  async function handleKeyDown(e) {
    if (e.metaKey && e.keyCode === 13) {
      setStatus('submitting');
      try {
        await submitForm(prompt);
        setStatus('success');
      } catch (err) {
        setStatus('typing');
        setError(err);
      }
    }
  }

  function handleTextareaChange(e) {
    setPrompt(e.target.value);
  }
  
  async function submitForm(q) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: q,
        temperature: 0.5,
        max_tokens: 4000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });
      setAnswer(response.data.choices[0].text)
    } catch(err) {
      setError(true)  
      console.log('err', err)
      setErrorMessage(err)
    }
  }

  function handleCopyClick() {
    navigator.clipboard.writeText(answer);
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  function handleAddText(text) {
    setPrompt(text);
  }

  let content = <div>
    <H2>Cosmic AI Assistant</H2>
    <p className="mb-2">What do you want Cosmic AI to generate? It can be a short or long form. Some examples:</p>
    <p className="mb-2">Translate 'Hello' into French, German, and Italian. <Button variant="subtle" onClick={() => handleAddText(`Translate 'Hello' into French, German, and Italian.`)}>Try it ▼</Button></p>
    <p className="mb-2">Write an article about the main causes for World War I. Reference historical quotes from world leaders. <Button variant="subtle" onClick={() => handleAddText(`Write an article about the main causes for World War I. Reference historical quotes from world leaders.`)}>Try it ▼</Button></p>
    <form className="mt-3" onSubmit={handleSubmit}>
      <Textarea
        placeholder="Ask me anything."
        value={prompt}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        disabled={status === 'submitting'}
        className="h-20 w-full"
        autoFocus
      />
      <br />
      <Button disabled={
        prompt.length === 0 ||
        status === 'submitting'
      }>
        { 
          status === 'submitting' &&
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        }
        { status === 'submitting' ? 'Generating...' : 'Generate' }
      </Button>
    </form>
  </div>
  if (status === 'success') {
    content = <div>
      <h2 className="mt-10 mb-4 scroll-m-20 border-b border-b-slate-200 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-slate-700">
        Prompt
      </h2>
      <div>{prompt}</div>
      <div className="relative mt-10">
        <h2 className="mb-4 scroll-m-20 border-b border-b-slate-200 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-slate-700">
          Answer
        </h2>
      </div>
      <div dangerouslySetInnerHTML={{ __html: str2br(answer)}} className="mb-5"></div>
      <div>
        <Button onClick={handleCopyClick}>
          { copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" /> }
          { copied ? 'Answer Copied' : 'Copy Answer' } 
        </Button>
        &nbsp;&nbsp;&nbsp;
        <Button onClick={handleAddToCosmic} disabled={addingToCosmic}>
          {
            !addingToCosmic &&
            <Download className="mr-2 h-4 w-4" />
          }
          { 
            addingToCosmic &&
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          }
          { addingToCosmic ? `Adding to Cosmic...` : `Add to this Object to Cosmic` }
        </Button>
        &nbsp;&nbsp;&nbsp;
        <Button onClick={resetForm}>
          <Lightbulb className="mr-2 h-4 w-4" />
          Ask another question
        </Button>
      </div>
    </div>
  }

  if (error && errorMessage) {
    content = <div>
      <div className="mb-3">
        An error occured.
      </div>
      <Button onClick={resetForm}>Try again</Button>
    </div>
  }

  return (
    <Layout>
      <Head>
        <title>Cosmic AI Assistant</title>
        <meta
          name="description"
          content="An AI Assistant"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container grid items-center gap-6 md:py-6">
        {content}
      </section>
    </Layout>
  )
}