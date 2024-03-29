import { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { createBucketClient } from "@cosmicjs/sdk"
import {
  Check,
  Copy,
  Download,
  ExternalLinkIcon,
  Lightbulb,
  Loader2,
} from "lucide-react"
import { Configuration, OpenAIApi } from "openai"
import TextareaAutosize from "react-textarea-autosize"

import { getParameterByName, str2br } from "@/lib/utils"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Settings
const PROMPTS = [
  `Translate 'Hello' into French, German, and Italian.`,
  `Write an article about the main causes for World War I. Reference historical quotes from world leaders.`,
]

let OPENAI_API_KEY
let openai
let COSMIC_BUCKET_SLUG
let COSMIC_READ_KEY
let COSMIC_WRITE_KEY
let COSMIC_CONTENT_TYPE

if (process.browser) {
  // on browser
  // Get default keys
  OPENAI_API_KEY =
    getParameterByName("openai_api_key") ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY
  COSMIC_BUCKET_SLUG =
    getParameterByName("bucket_slug") ||
    process.env.NEXT_PUBLIC_COSMIC_BUCKET_SLUG
  COSMIC_READ_KEY =
    getParameterByName("read_key") ||
    process.env.NEXT_PUBLIC_COSMIC_BUCKET_READ_KEY
  COSMIC_WRITE_KEY =
    getParameterByName("write_key") ||
    process.env.NEXT_PUBLIC_COSMIC_BUCKET_WRITE_KEY
  COSMIC_CONTENT_TYPE =
    getParameterByName("type") || process.env.NEXT_PUBLIC_COSMIC_CONTENT_TYPE
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  })
  openai = new OpenAIApi(configuration)
}

function H2(text) {
  return (
    <h2 className="mb-2 mt-10 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-neutral-700">
      {text.children}
    </h2>
  )
}

export default function IndexPage() {
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [status, setStatus] = useState("typing")
  const [copied, setCopied] = useState(false)
  const [answer, setAnswer] = useState("")
  const [addingToCosmic, setAddingToCosmic] = useState(false)
  const [cosmicBucketConfig, setCosmicBucketConfig] = useState({
    bucketSlug: COSMIC_BUCKET_SLUG,
    readKey: COSMIC_READ_KEY,
    writeKey: COSMIC_WRITE_KEY,
    type: COSMIC_CONTENT_TYPE,
  })
  const [cosmicObject, setCosmicObject] = useState({ id: false })
  const [showCosmicConfigForm, setShowCosmicConfigForm] = useState(false)
  const [addedToCosmic, setAddedToCosmic] = useState(false)

  async function handleAddToCosmic(e) {
    if (
      !cosmicBucketConfig.bucketSlug ||
      !cosmicBucketConfig.readKey ||
      !cosmicBucketConfig.writeKey ||
      !cosmicBucketConfig.type
    ) {
      setShowCosmicConfigForm(true)
      return
    }
    const cosmic = createBucketClient({
      bucketSlug: cosmicBucketConfig.bucketSlug,
      readKey: cosmicBucketConfig.readKey,
      writeKey: cosmicBucketConfig.writeKey,
    })
    setAddingToCosmic(true)
    console.log("sending")
    const post = {
      title: prompt,
      metadata: {
        content: str2br(answer)
      },
      type: cosmicBucketConfig.type,
    }
    try {
      const added = await cosmic.objects.insertOne(post)
      console.log("Added!", added)
      setCosmicObject(added.object)
      setAddingToCosmic(false)
      setAddedToCosmic(true)
    } catch (error) {
      console.log(error)
      setAddingToCosmic(false)
      setError(true)
      setErrorMessage(error.message)
    }
  }

  async function resetForm(e) {
    setStatus("")
    setPrompt("")
    setError(false)
    setErrorMessage("")
    setAddedToCosmic(false)
  }

  async function handleSubmitPromptForm(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setStatus("submitting")
    try {
      await submitPromptForm(prompt)
      setStatus("success")
    } catch (err) {
      setStatus("typing")
      setError(err)
    }
  }

  async function handleKeyDown(e) {
    if (e.metaKey && e.keyCode === 13) {
      setStatus("submitting")
      try {
        await submitPromptForm(prompt)
        setStatus("success")
      } catch (err) {
        setStatus("typing")
        setError(err)
      }
    }
  }

  function handleTextareaChange(e) {
    setPrompt(e.target.value)
  }

  async function submitPromptForm(q) {
    try {
      // const response = await openai.createCompletion({
      //   model: "text-davinci-003",
      //   prompt: q,
      //   temperature: 0.5,
      //   max_tokens: 4000,
      //   top_p: 1.0,
      //   frequency_penalty: 0.0,
      //   presence_penalty: 0.0,
      // })
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: q }],
        temperature: 0.5,
        max_tokens: 4000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      })
      setAnswer(response.data.choices[0].message.content)
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.error.message)
      } else {
        setErrorMessage(error.message)
      }
      setError(true)
    }
  }

  function handleCopyClick() {
    navigator.clipboard.writeText(answer)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  function handleAddText(text) {
    setPrompt(text)
  }

  function handleSaveConfig(e) {
    e.preventDefault()
    const bucketSlug = e.target.bucket_slug.value
    const readKey = e.target.read_key.value
    const writeKey = e.target.write_key.value
    const type = e.target.type.value
    setCosmicBucketConfig({
      bucketSlug,
      readKey,
      writeKey,
      type,
    })
    setShowCosmicConfigForm(false)
  }

  function handleCancelClick() {
    setShowCosmicConfigForm(false)
  }

  let content = (
    <div>
      <H2>Cosmic AI Assistant</H2>
      <p className="mb-2">
        What content do you want to generate? It can be a short request or a
        long form article. Some examples:
      </p>
      {PROMPTS.map((text, i) => {
        return (
          <p className="mb-2" key={`prompt-${i}`}>
            {text}{" "}
            <Button variant="subtle" onClick={() => handleAddText(text)}>
              Try it ▼
            </Button>
          </p>
        )
      })}
      <form className="mt-3" onSubmit={handleSubmitPromptForm}>
        <TextareaAutosize
          placeholder="Ask or tell me to write anything."
          value={prompt}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={status === "submitting"}
          minRows={3}
          className="flex h-20 w-full rounded-md border border-neutral-300 bg-transparent p-3 text-base placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-50 dark:focus:ring-neutral-400 dark:focus:ring-offset-neutral-900"
          autoFocus
        />
        <br />
        <Button disabled={prompt.length === 0 || status === "submitting"}>
          {status === "submitting" && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {status === "submitting" ? "Generating..." : "Generate"}
        </Button>
      </form>
    </div>
  )
  if (status === "success") {
    content = (
      <div>
        <H2>Prompt</H2>
        <div>{prompt}</div>
        <div className="relative mt-10">
          <H2>Answer</H2>
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: str2br(answer) }}
          className="mb-5"
        ></div>
        <div>
          <Button className="mb-4" variant="subtle" onClick={handleCopyClick}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Answer Copied" : "Copy answer"}
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button className="mb-4" variant="subtle" onClick={resetForm}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Ask another question
          </Button>
          &nbsp;&nbsp;&nbsp;
          {!addedToCosmic && (
            <>
              <Button
                className="mb-4"
                onClick={handleAddToCosmic}
                disabled={addingToCosmic}
              >
                {!addingToCosmic ? (
                  <Download className="mr-2 h-4 w-4" />
                ) : (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {addingToCosmic ? `Saving to Cosmic...` : `Save this to Cosmic`}
              </Button>
            </>
          )}
          {addedToCosmic && (
            <Button className="mb-4" disabled>
              <Check className="mr-2 h-4 w-4" /> Saved to Cosmic
            </Button>
          )}
          &nbsp;&nbsp;&nbsp;&nbsp;
          {cosmicObject.id && (
            <Link
              className="h-4 w-4"
              target="_blank"
              href={`https://beta.cosmicjs.com/${cosmicBucketConfig.bucketSlug}/objects/${cosmicObject.id}`}
            >
              Go to Object&nbsp;&nbsp;
              <ExternalLinkIcon className="relative top-[-5px] inline-block h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (showCosmicConfigForm) {
    content = (
      <div>
        <div className="mb-4">
          Your Cosmic Bucket config options are required to save this to your
          Bucket.
        </div>
        <div className="mb-4">
          Find these options in{" "}
          <i>
            <Link target="_blank" href="https://beta.cosmicjs.com/login">
              Bucket &gt; Settings &gt; API Access{" "}
              <ExternalLinkIcon className="relative top-[-5px] inline-block h-4 w-4" />
            </Link>
          </i>
          &nbsp; (You will need access to the&nbsp;
          <i>
            <Link target="_blank" href="https://beta.cosmicjs.com">
              v2 dashboard{" "}
              <ExternalLinkIcon className="relative top-[-5px] inline-block h-4 w-4" />
              )
            </Link>
          </i>
          .
        </div>
        <form onSubmit={handleSaveConfig}>
          <div className="mb-5">
            <Label className="mb-2 block text-base">Bucket slug</Label>
            <Input
              className="text-base"
              name="bucket_slug"
              autoFocus
              type="text"
              placeholder="your-bucket-slug"
              defaultValue={cosmicBucketConfig.bucketSlug}
            />
          </div>
          <div className="mb-5">
            <Label className="mb-2 block text-base">Bucket read key</Label>
            <Input
              className="text-base"
              name="read_key"
              type="text"
              placeholder="your-bucket-read-key"
              defaultValue={cosmicBucketConfig.readKey}
            />
          </div>
          <div className="mb-5">
            <Label className="mb-2 block text-base">Bucket write key</Label>
            <Input
              className="text-base"
              name="write_key"
              type="text"
              placeholder="your-bucket-write-key"
              defaultValue={cosmicBucketConfig.writeKey}
            />
          </div>
          <div className="mb-5">
            <Label className="mb-2 block text-base">Object type slug</Label>
            <p>* Requires a rich text Metafield with key <code>content</code></p>
            <Input
              className="text-base"
              name="type"
              type="text"
              placeholder="your-content-type-slug"
              defaultValue={cosmicBucketConfig.type}
            />
          </div>
          <div className="mb-3">
            <Button type="submit" className="mr-4">
              Save config
            </Button>
            <Button onClick={handleCancelClick} variant="subtle">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (error && errorMessage) {
    content = (
      <div>
        <div className="mb-3">An error occured.</div>
        <div className="mb-3">{errorMessage}</div>
        <Button onClick={resetForm}>Try again</Button>
      </div>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Cosmic AI Assistant</title>
        <meta name="description" content="An AI Assistant" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container grid items-center gap-6 py-6">
        {content}
      </section>
    </Layout>
  )
}
