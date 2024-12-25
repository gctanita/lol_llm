# What do I want to do?

I am an avid League of Legends player. I have been playing the game since 2010, so, yeaah. Not competitive, and in the last 5 years or more, it's been mainly ARAM only. 

One of the frustrations that I have, as a player, is that there are a lot of variables to take into account when buying items. There are constant changes to the champions, constant changes to the items, each match is different, as there are diffrent champions in your team and in the enemy team. No matter how you look at it, it's always different. 

As I was thinking about how I could test an LLM, as I am a QA, I was also thinking back on almost 15 years of experience, and how I have managed to hone a deep understanding of the systems that I test, and the way they work. Then a curiosity struck me: could I build an LLM that could suggest while playing, what items to build? I have chatGpt to help me out, I have theoretical knowledge on LLMs and how they work. 

Sounds like an interesting challenge :D (Famous last words probably... but hey... It's worth giving it a shot...)



# Deep breath, where do I start?

In order to train an LLM there are a few stages that we have to go through:
- data collection
- data pre-processing
- model selection
- training
- evaluation

Let's understand a bit the steps above. Before we jump right in, and see what each of them means for our project. 

## Data collection 
In order to build an LLM the data is the foundation of it. The data that we gather has to be relevant so the system will be able to make prediction on our topic. We will need data regarding:
- items characteristics
- champion characteristics and abilities
- historic matches
- win rates on different builds
- win rates in different team compositions
- experience with the champion for all the players

And in this area the Data Quality Management comes in, and we'll have to check the data that we gather for:
- completness - the data that we have gathered contains all relevant aspects 
- accuracy and consistency - check for inconsistencies in the training data and correct them
- relevance - data should be relevant to the specific task the LLM will do
- bias mitigation - identifying and mitigating biases within the data

There are some tools that could help us with this:
- Data Versioning & Tracking – (DVC, MLflow)
- Data Annotation & Labeling – (Labelbox, Amazon SageMaker )
- Data Pipelines – (Apache Airflow, Kubeflow Pipelines)
- Data Storage & Management – (AWS S3, Google Cloud Storage)
- Data Quality & Governance – (DataRobot MLOps)
- Data Collaboration & Sharing – (Databricks, GitHub)
- Data Privacy & Compliance: (Data Masking and Anonymization Tools, Audit and Logging Tools)

We will get to them as the need will arise, it's important that they exist, and might help us. No need to reinvent the wheel. 


## Data pre-processing
In this step we will have to clean and prepare the raw text data for machine learning. We'll have to standardize the input data to reduce the complexity that the model needs to handle. 

### Data cleaning
This is a fundamental step and involves identifying and rectifying inaccuracies, inconsistencies, and irrelevant elements within the raw text data. Common data-cleaning procedures include removing duplicate entries, handling missing or erroneous values, and addressing formatting irregularities. Additionally, text-specific cleaning tasks such as removing special characters, punctuation, and stop words are performed to streamline the textual input.

Data cleaning methods:
- handling missing values - if there are gaps in the data, then you can't make accurate prediction 
- noise reduction - eliminate irrelevant or random information
- consistency checks - the dataset adheres to consistent formats, rules, or conventions. If you have multiple data sources, there might be inconsistencies in between them
- deduplication - there should not be data duplicates, as they introduce disturbences in the data distribution

### Parsing
Parsing involves analyzing the data syntax to extract meaningful information. here we have 2 categories of data structures types: structured (like XML, JSON, HTML) and non-structured like natural language processing. 

### Normalization
In this step we will have to ensure our data is standardized to ensure uniformity and consistency in language usage and minimize the complexity for NLP models. E.g. converting text to a common case, to eliminate variations from capitalization, bringing the dates to the same format and time zone. This way the vocabulary size and model complexity should be reduced.

### Tokenization
Tokenization creates a structured and manageble input for the model, by breaking down the text into tokens the model gains a granular understanding of language usage. This process forms the biasis for text processing for LLMs, 

### Stemming and lemmatization
Stemming and lemmatization are crucial pre-processing techniques aimed at reducing words to their base or root form. These processes decrease the vocabulary size the model needs to learn. 

Stemming is a rudimentary process involving the removal of suffixes from a word. On the other hand, lemmatization is a more sophisticated process that considers the context and part of speech of a word to accurately reduce it to its base form, known as the lemma. These techniques help simplify the text data to make it easier for the model to understand and learn.

### Feature engineering 
Feature engineering involves creating informative features or representations that make it easier for machine learning models to map the input data to the output. Feature engineering is a strategic step for improving model performance by introducing additional knowledge or structure into the input data. While preprocessing prepares the data for analysis, feature engineering enhances data to make it more suitable for machine learning algorithms.

**Word embeddings** -  mapping words or phrases to vectors of real numbers. Tools such as Word2Vec, GloVe, and FastText are known for generating static word embeddings. Each provides a dense, low-dimensional, and learned representation of text data.

**Contextual embeddings** - capture the meaning of words based on their context within a sentence, leading to dynamic representations. This contextual awareness allows them to better represent polysemy (words with multiple meanings) and homonyms (words with the same spelling but different meanings). For instance, the word "bank" can refer to a financial institution or the edge of a river

**Subword embeddings** - representing words as vectors of subword units. This approach is useful for handling rare or out-of-vocabulary (OOV) words—the words not present in the model's vocabulary. The model can still assign meaningful representations to these unknown words by breaking down words into their constituent subwords

### Advanced data processing techniques
**Dimensionality reduction** is a powerful data processing technique used to reduce the number of input variables in a dataset while retaining most of the original information. High-dimensional data can be challenging for LLMs as it increases computational complexity and can lead to overfitting.

**Feature selection** involves selecting the most relevant features for model training. In the context of LLMs, features could be words, phrases, or other text elements. With thousands of potential features in text data, identifying those that contribute most significantly to the model's predictive performance is crucial.


## Model selection
The specifics of AI model training depends on your use case. Selecting machine learning training models is the domain of the data science expert.

**Reinforcement learning models** run a number of simulations where the AI attempts to produce an output or reach a goal using trial and error. The model takes actions, then receives positive or negative reinforcement based on whether it reached the outcome. 

**Deep learning models** use neural networks to learn from data. They can be fed information, and within each repetition, they can start to classify this information and draw distinctions. For example, you might feed a deep learning AI model images, and it might learn on a first repetition that a specific image includes furniture. Then, in a subsequent learning cycle, it may start to draw distinctions between types of furniture, like learning the difference between a chair with cushions and a table. 

Choosing the right model for a given task will depend on your goal—in the previous example, reinforcement learning might make more sense in business goal forecasting while deep learning makes more sense for building models that need to recognize things like images, documents, or text. Often, a task might involve using multiple methods. 

I think that for our goal, we would probably need a Reinforcement learning model. Here's my trail of thought: in the data I am hoping we will be able to gather, there will be a lot of matches information, like champion composition and items, and we also know the result. So it will get the input data, the match data and it will make a predcition, and we will correct that prediction with the actual outcome of the match. We'll have to find along the way how to do this. 

## Training
This is the step where the model learns the data, and the relation between everything, and is corrected, and iterations are added, and so on. 

## Evaluation
This is the testing part, where we will try to test it in real world and see the predictions. 






# Documentation Sources
- https://appian.com/blog/acp/ai/how-does-ai-model-training-work
- https://www.deepchecks.com/question/what-are-the-data-collection-strategies-for-llmops/#:~:text=It%20serves%20as%20the%20base,and%20translation%2C%20among%20other%20roles. 
- https://www.turing.com/resources/understanding-data-processing-techniques-for-llms#a.-pre-processing

