# Setting up Untangle's "Simplify" feature

Untangle's sentence-highlighting works instantly with no setup — it runs
entirely in your browser. The **"Simplify this sentence"** button is the one
feature that calls an AI model (Meta's Llama, hosted on Hugging Face), so it
needs a free API key from you. This takes about 2 minutes.

## Step 1: Create a Hugging Face account
Go to [huggingface.co/join](https://huggingface.co/join) and sign up (free, just an email + password).

## Step 2: Accept the Llama model license
Go to the [Llama-3.2-3B-Instruct model page](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct).
You'll see a license agreement box — fill it out and click **"Agree and access repository."**
Meta auto-approves almost instantly, so you can move to the next step right away.

## Step 3: Create an access token
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **"Create new token"**
3. Give it any name (e.g. `untangle`)
4. Under **Token type**, choose **Read**
5. Click **Create token**
6. Copy the token — it starts with `hf_`. You won't be able to see it again after leaving this page, so copy it now.

## Step 4: Add it to Untangle
1. Right-click the Untangle icon in your Chrome toolbar → **Options**
   (or go to `chrome://extensions` → find Untangle → **Details** → **Extension options**)
2. Paste your token into the field
3. Click **Save**

That's it — hover over any highlighted sentence and click "Simplify this sentence."

## FAQ

**Is this free?**
Yes, Hugging Face's Inference API has a free tier that's more than enough for personal use.

**Does my key get sent anywhere besides Hugging Face?**
No. Your key is stored only in your browser's local extension storage and is used only to call Hugging Face's API directly from your machine. Untangle has no server of its own.

**"Simplify" says failed — what do I check?**
- Confirm you accepted the license in Step 2 (this is the #1 cause of failures)
- Confirm your token was copied correctly, with no extra spaces
- Confirm you clicked Save on the Options page after pasting it