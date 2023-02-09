import Head from "next/head"
import { Layout } from "@/components/layout"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Lightbulb, Copy, Check } from "lucide-react"
import { getParameterByName, str2br } from "@/lib/utils"
import { useState } from 'react';
import { Configuration, OpenAIApi } from "openai";
import Cosmic from "cosmicjs"
const api = Cosmic()

let OPENAI_API_KEY;
let openai;
if (process.browser) {
   // on browser
  OPENAI_API_KEY = getParameterByName('openai_api_key') || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
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
    } catch(error) {
      if (error.response) {
        setErrorMessage(error.response.data.error.message);
      } else {
        setErrorMessage(error.message);
      }
      setError(true)  
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
    <p className="mb-2">What do you want Cosmic AI to generate? It can be a short request or a long form article. Some examples:</p>
    <p className="mb-2">Translate &apos;Hello&apos; into French, German, and Italian. <Button variant="subtle" onClick={() => handleAddText(`Translate 'Hello' into French, German, and Italian.`)}>Try it ▼</Button></p>
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
      <H2>
        Prompt
      </H2>
      <div>{prompt}</div>
      <div className="relative mt-10">
        <H2>
          Answer
        </H2>
      </div>
      <div dangerouslySetInnerHTML={{ __html: str2br(answer)}} className="mb-5"></div>
      <div>
        <Button className="mb-4" onClick={handleCopyClick}>
          { copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" /> }
          { copied ? 'Answer Copied' : 'Copy Answer' } 
        </Button>
        { 
          // If Cosmic content type set
          getParameterByName('type') &&
          <>
            &nbsp;&nbsp;&nbsp;
            <Button className="mb-4" onClick={handleAddToCosmic} disabled={addingToCosmic}>
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
          </>
        }
        &nbsp;&nbsp;&nbsp;
        <Button className="mb-4" onClick={resetForm}>
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
      <div className="mb-3">
        { errorMessage }
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