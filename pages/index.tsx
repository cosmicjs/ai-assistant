import Head from "next/head"
import { Layout } from "@/components/layout"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"


import { useState } from 'react';

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// const Cosmic = require("cosmicjs")
// const api = Cosmic({
//   apiEnvironment: 'staging'
// })

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

// const sendAnswerToCosmic = async (answer) => {
//   const bucket = api.bucket({
//     slug: getParameterByName('bucket_slug'),
//     read_key: getParameterByName('read_key'),
//     write_key: getParameterByName('write_key')
//   })
//   console.log('sending')
//   try {
//     const edit = await bucket.objects.updateOne({
//       id: getParameterByName('object_id')
//     }, {
//       $set: {
//         content: str2br(answer)
//       }
//     })
//     console.log('Update!', edit)
//   } catch (err) {
//     console.log(err)
//   }
// }


export default function IndexPage() {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('typing');
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState('');
  const [addToCosmic, setAddToCosmic] = useState(false);

  // if (addToCosmic) {
  //   sendAnswerToCosmic(answer)
  //   setAddToCosmic(false);
  // }
  /* Prompts
  Headless CMS
  Write a 500 word article about why using a headless CMS may be a better choice than wordpress for building modern websites.

  React CMS
  Write a 5 paragraph article that ranks for seo for react cms that discusses why Cosmic CMS is the best content management system for your react applications. Use a brief code example from https://docs.cosmicjs.com
  */
  // if (error) {
  //   alert(error)
  // }
  function handleCopyClick() {
    navigator.clipboard.writeText(answer);
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  let content = <div>
    <form onSubmit={handleSubmit}>
      <Textarea
        placeholder="Ask Cosmic Writing Assistant anything. It can be something short like: Translate 'Hello' into French, German, and Italian. Or something long like: Write an article that will rank in search results for '10 best ramen restaurants in the San Francisco bay area'."
        value={prompt}
        onChange={handleTextareaChange}
        disabled={status === 'submitting'}
        className="h-20 w-full"
        autoFocus
      />
      <br />
      <Button disabled={
        prompt.length === 0 ||
        status === 'submitting'
      }>
        { status === 'submitting' ? 'Submitting...' : 'Submit' }
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
        <div className="absolute top-0 right-0">
            <Button onClick={handleCopyClick}>{ copied ? 'Copied' : 'Copy' } 
            { copied ? <Icons.copied className="ml-2 h-5 w-5" /> : <Icons.copy className="ml-2 h-5 w-5" /> }</Button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: str2br(answer)}} className="mb-5"></div>
      <div>
        {/* <Button onClick={handleAddToCosmic}>Add to this Object content area</Button>
        &nbsp;&nbsp;&nbsp; */}
        <Button onClick={resetForm}>Ask another question</Button>
      </div>
    </div>
  }


  async function handleAddToCosmic(e) {
    setAddToCosmic(true);
  }

  async function resetForm(e) {
    setStatus('');
    setPrompt('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await submitForm(prompt);
      setStatus('success');
    } catch (err) {
      setStatus('typing');
      setError(err);
    }
  }

  function handleTextareaChange(e) {
    setPrompt(e.target.value);
  }
  
  async function submitForm(q) {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: q,
      temperature: 0.5,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    console.log(response.data.choices[0].text)
    setAnswer(response.data.choices[0].text)
  }
  return (
    <Layout>
      <Head>
        <title>Cosmic AI Writing Assistant</title>
        <meta
          name="description"
          content="An AI Writing Assistant"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10">
        {content}
      </section>
    </Layout>
  )
}