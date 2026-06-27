import { Template } from '@/types';

export const presetTemplates: Template[] = [
  // 1. PAYMENT METHOD SETUP
  {
    id: 'pay-setup-01',
    title: 'Payment Method Setup (Detailed)',
    description: 'Provide clients with the requirements for setup and step-by-step dashboard instructions.',
    category: 'Payment Setup',
    isFavorite: false,
    isCustom: false,
    content: `To set up the pa-yment method, please follow the steps below:

If you would like me to set up the Shopify pa-yment method for you, I would need the following information:

01. Full Name
02. Full Address
03. Date of Birth
04. Social Security Number(SSN)
05. TAX ID
06. Ban-k Account N-umber
07. Residential address document (such as a utility bill, bank statement, or official letter showing your name and address)
08. Identity document (such as a passport, national ID card, or driver’s license)
09. Ph_one Number
10. Shopify store main login.

Or, if you can set up pa-yment gateway from your end. You can see the pa-yment gateway setup instructions, please follow these steps-

>> Go to the Shopify Admin panel
>> Click Settings
>> Click Pa-yment Options

From here, you will see all available pa-yment methods, including Shopify Pa-yments, Pa-yPal, and Manual Pa-yment Methods.

For further assistance, I’ve also provided a helpful video on how to set up the pa-yment method:

Here is this URL: https://docs.google.com/document/d/1shb2g9yXsYfxwzl2-i8McwZfDZ9TcazvkKLsblHHxZk/edit?usp=sharing

Please follow the instructions and set up the pa-yment method on your end. If you encounter any issues or need further assistance, feel free to let me know. I’m here to help and will take care of the rest.

Thank you.`,
    variables: []
  },
  {
    id: 'pay-setup-02',
    title: 'Payment Setup Instructions (Basic)',
    description: 'A simpler request for payment info with standard admin manual instructions.',
    category: 'Payment Setup',
    isFavorite: false,
    isCustom: false,
    content: `Here are the p_ayment instructions: 

If you can provide me with the following information, I can set the Shopify pa-yment method for you:

01. Full Name
02. Full Address
03. Date of Birth
04. Social Security Number(SSN)
05. TAX ID
06. Ban-k Account N-umber

If you feel any hesitation in providing the above information, you can set up pa-yment gateway from your end following these steps-

>> Go to the Admin panel
>> Click Settings
>> Click Pa-yment Options

Then you can see all the pa-yment options like Shopify Pa-yment, Pa-ypal, and Manual pa-yment methods.

Also, you can see the video on how you can add the pa-yment method to your store.

Here is this URL:  https://docs.google.com/document/d/1shb2g9yXsYfxwzl2-i8McwZfDZ9TcazvkKLsblHHxZk/edit?usp=sharing

Please follow the instructions and set up the pa_yment method from your end. If you face any issues with that, please let me know.

Thank you.`,
    variables: []
  },
  {
    id: 'pay-setup-03',
    title: 'Payment Gateway Reminder Note',
    description: 'Gentle notification that the payment gateway is missing and needs setup.',
    category: 'Payment Setup',
    isFavorite: false,
    isCustom: false,
    content: `P-ayment instructions

Note:  I checked and noticed that you didn't set up your pa-yment getaway to your store. So I've sent you instructions on how can you set up the pa-yment getaway to your store. Please follow the instructions.

For pa-yment method instruction:

To check the pa-yment method, you need to follow some steps: 

 >> Go to the Admin panel
>> Click Settings
>> Click Pa-yment Options

Then you can see all the pa-yment options, like Shopify Pa-yment, Pa-ypal, and Manual pa-yment methods.

Also, you can see the video on how you can add the pa-yment method to your store. Here is the URL: https://docs.google.com/document/d/1MXPahESNwNxFQh-UcLupywqVmZiRqIMVx1DVWgBN_qw/edit?usp=sharing

Please follow the instructions and set up the pa_yment method from your end. If you face any issues with that, please let me know.

Thank you.`,
    variables: []
  },
  {
    id: 'pay-setup-04',
    title: 'Payment Query Reply (Gilansah)',
    description: 'Detailed reply clarifying payment gateway tasks, options, or video meeting setups.',
    category: 'Payment Setup',
    isFavorite: false,
    isCustom: false,
    content: `Hi {{client_name}},

I trust this message finds you in good health and spirits.

I completely understand your concern, and you are right that you have already paid for the pa-yment method integration. I want to clarify the process from my side, so everything is smooth:

As you know, to connect the pa_yment method on your Shopify store, I need your Shopify main login credentials and your Pa_yPal login credentials. Once I have these, I can immediately set up the pa_yment method for you.

Secondly, if you prefer not to share the login credentials, we can arrange a quick meeting where I can guide you and complete the pa_yment setup directly.

I hope this explains my thinking and the current situation clearly. Please let me know which option works best for you so we can proceed without delay.

Thank you for your understanding and cooperation.`,
    variables: ['client_name']
  },

  // 2. DELIVERY FOLLOWUP
  {
    id: 'del-followup-01',
    title: 'Delivery Followup (30 Days Support)',
    description: 'Ask client if modifications are needed or if we can proceed with delivery.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope you are doing well.

Do you need any modifications, adjustments, or support from my side? If you need any help, please feel free to let me know.

Or, if everything looks good on your end, please confirm so I can proceed with the project delivery.

Please don’t worry, after delivery, I will provide 30 days of ongoing support. During this time, if you need any modifications or adjustments, feel free to contact me via my Fiverr inbox, and I will take care of everything.

Thank you.`,
    variables: []
  },
  {
    id: 'del-followup-02',
    title: 'Delivery Draft Review (Fite Store)',
    description: 'Follow up after sending a draft review with preview URL and delivery proposal.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope you're doing well.

I just wanted to check if you had a chance to review the last update I sent. Please review everything and let me know if you'd like any changes or modifications. I’ll be happy to make any adjustments as needed.

You can view the draft here: {{store_url}}

Also, If everything looks good, may I deliver the project to you?

No worries about the delivery; you will receive 30 days of ongoing support from me. If you need any modifications, feel free to let me know.

Thank you for your support and cooperation.

Best regards.`,
    variables: ['store_url']
  },
  {
    id: 'del-followup-03',
    title: 'Delivery Check - Completed Tasks Option 1',
    description: 'Short follow-up stating all tasks are done and offering Fiverr inbox post-delivery support.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `As per your instructions, I—------

Note: Also, I've completed all of the tasks on my end. If everything looks good, can I deliver this project to you?

No worries about the project delivery. After delivery, if you need any changes or modifications, you can let me know in my "Fiverr Inbox". I will take care of the rest.

Please let me know your thoughts.

Thank you.`,
    variables: []
  },
  {
    id: 'del-followup-04',
    title: 'Delivery Check - Completed Tasks Option 2',
    description: 'Alternative completed tasks request template mentioning 30 days support in Fiverr inbox.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Since I have completed all of the tasks and modifications from my end. So, can I deliver the project to you?

No worries about this project. After delivery, I will give 30 days of ongoing support to you. In the support period, if you need any changes or modifications, you can let me know in my "Fiverr inbox". I'll take care of the rest.

Please find the result at your end and let me know your thoughts.

Thank you.`,
    variables: []
  },
  {
    id: 'del-followup-05',
    title: 'Delivery Check - Take Your Time',
    description: 'Polite delivery check that emphasizes taking their time for feedback.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Hi There,

Hope you are doing well. 

Take your time to review, and whenever you're available, feel free to let me know if you’d like any changes or adjustments. I’m here to refine everything based on your feedback.

If everything looks good, can I deliver this project to you?

No worries about this project. After delivery, I will give you 30 days of ongoing support. In the support period, if you need any changes or modifications, you can let me know in my "Fiverr inbox.". I'll take care of the rest.

Please let me know if you need any changes or modifications.

Thank you.`,
    variables: []
  },

  // 3. FINAL DELIVERY MESSAGES
  {
    id: 'del-msg-01',
    title: 'Final Project Delivery Message 1',
    description: 'Formal delivery submission message offering post-delivery revisions.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Since I have completed all of the tasks, so I am delivering this project to you.

No worries about the delivery. if you need any changes or modifications, please let me know in my "Fiverr inbox" and then I'll work on it and get back to you with an update asap.

Also, you will get 30 days of ongoing support from me. So the delivery will not be a problem.

Feel free to share if you need any changes or modifications I'm happy to modify them. Hope you understand my concern.

Thank you so much.`,
    variables: []
  },
  {
    id: 'del-msg-02',
    title: 'Final Project Delivery Message 2',
    description: 'Polite template highlighting future collaboration and accepting the job.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Since I have completed all tasks from my end, I am delivering this project to you.

No worries about this project. Based on my work, you will get 30 days of ongoing support for this project. In this support period, if you need any changes or modifications, you can let me know in my "Fiverr Inbox". I will take care of the rest.

If everything looks great, please accept the job.

It's a pleasure to work with you, and I hope we'll work together in the future.

Thank you!`,
    variables: []
  },
  {
    id: 'del-msg-milestone',
    title: 'Milestone Delivery Message',
    description: 'Submission text for partial milestones, prompting acceptance to start next tasks.',
    category: 'Delivery',
    isFavorite: false,
    isCustom: false,
    content: `Since I have completed the first milestone tasks from my end, I am delivering this project to you.

No worries about this project. in the second milestone, If you need any changes or modifications, you can let me know on my "Fiverr Inbox" or "Order page.". I will take care of the rest.

If everything looks great, please accept the first milestone. I will start working on the second milestone.

Thank you!`,
    variables: []
  },

  // 4. DELIVERY EXTENSION MESSAGES
  {
    id: 'ext-msg-01',
    title: 'Date Extension - Time Required',
    description: 'Polite extension request when more time is needed to complete the project.',
    category: 'Extension',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

Since the project delivery date is nearing and need your times, I am sending you a delivery date extension.

Please accept the delivery date extension from your end so that we can have a safe project.

Thank you.`,
    variables: []
  },
  {
    id: 'ext-msg-02',
    title: 'Date Extension - Review Wait time',
    description: 'Request extension while the client takes time to review updates.',
    category: 'Extension',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

Since you need time to review my work update, I am sending you an extension on the delivery date.

Please accept the delivery date extension from your end so that we can have a safe project.

Thank you.`,
    variables: []
  },
  {
    id: 'ext-msg-03',
    title: 'Date Extension - Approaching Timeline',
    description: 'Urgent extension notice as delivery clock is running out.',
    category: 'Extension',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope you are doing well.

Since you need time to review my work update . The delivery timeline is about to end. So, I'm sending you an extension request.

Please accept the extension request to proceed with the work smoothly.

Thank you.`,
    variables: []
  },

  // 5. CLIENT FOLLOWUPS
  {
    id: 'followup-01',
    title: 'Followup - First Work Update Check',
    description: 'Followup regarding the first draft. Includes store url and password placeholders.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope this message finds you well. I wanted to follow up on the first update I shared regarding the store. When you have a moment, please check it and let me know if any adjustments are required.

>> Here is the store URL: {{store_url}}
>> Password: {{store_password}}

Your feedback is highly appreciated, and I am ready to implement any changes promptly. I look forward to your response so we can proceed efficiently.

Thank you.`,
    variables: ['store_url', 'store_password']
  },
  {
    id: 'followup-02',
    title: 'Followup - Revision Mode Warning (Amonebln)',
    description: 'Urgent follow-up indicating that being in revision mode impacts developer stats.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hello {{client_name}},

I wanted to follow up regarding the project amendments. Could you please share them at your earliest convenience so I can complete the work?

As you know, the order is still in revision mode, which is impacting my profile. I would appreciate your feedback. Once I receive your input, I will finalize and deliver the project.

Thank you for your understanding.`,
    variables: ['client_name']
  },
  {
    id: 'followup-03',
    title: 'Followup - Profile Impact Revision Notice',
    description: 'General template warning client that prolonged revision status affects dashboard stats.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope you're doing well.

I wanted to follow up regarding the project amendments. Could you please share them at your earliest convenience so I can complete the work?

Since the order is in revision, it is impacting my profile. Receiving the amendments will allow me to finish the work promptly.

Thank you.`,
    variables: []
  },
  {
    id: 'followup-04',
    title: 'Followup - Generic Update Request',
    description: 'Checking in to see if the client has had a chance to review the last update.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I hope you're doing well.

I just wanted to check if you had a chance to review the last update I sent. Please review everything and let me know if you'd like any changes or modifications. I’ll be happy to make any adjustments as needed.

Thank you for your support and cooperation.

Best regards.`,
    variables: []
  },
  {
    id: 'followup-05',
    title: 'Followup - Did you see my message?',
    description: 'Short follow-up check to make sure they received the last message.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hello again,

I was wondering if you saw my last message. 

Feel free to let me know if you’d like any changes or adjustments. I’m here to refine everything based on your feedback.

Thank you!`,
    variables: []
  },
  {
    id: 'followup-06',
    title: 'Followup - Any updates for me?',
    description: 'Simple ping asking for status updates.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I'm wondering! Do you have any updates for me?

Please let me know if you need any changes or modifications. I’m here to refine everything based on your feedback.

Thank you.`,
    variables: []
  },
  {
    id: 'followup-07',
    title: 'Followup - Login access authentication code',
    description: 'Requesting shopify login auth/security pin code.',
    category: 'Followup',
    isFavorite: false,
    isCustom: false,
    content: `Hello again,

I was wondering if you saw my last message. I haven’t received store login credentials or access to your Shopify account yet. I couldn't confirm it since it needs an authentication code. Could you please provide the Shopify login credentials at your earliest convenience?

Looking forward to your response.

Thank you!`,
    variables: []
  },
  {
    id: 'followup-login-req',
    title: 'Get Shopify Login & Asset checklist',
    description: 'Requirements list for new Shopify stores (collaborator access, product details, assets, fonts).',
    category: 'Store Access',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

Hope you are doing very. 

To move forward with the design and development of your Shopify store, I’ll need a few things from your side so I can properly set everything up and match your brand style:

>> Shopify store login access or add me as a collaborator. (so I can start building and configuring the website)
>> Product details (names, descriptions, pricing, and variants if available)
>> All product images/assets from your photographer
>> Custom font files and logo file

Feel free to share the files and log in whenever you're ready, and I’ll get started right away.

Thank you`,
    variables: []
  },

  // 6. MEETINGS & CALLS
  {
    id: 'meeting-01',
    title: 'Meeting Followup - Discussion Offer',
    description: 'Invite the client to a Zoom/Fiverr meeting between 10 AM to 6 PM GMT+6.',
    category: 'Meeting',
    isFavorite: false,
    isCustom: false,
    content: `Also, please review everything and feel free to share your feedback. I'll make the changes based on your needs. If you want, we can jump on a meeting and discuss(10 AM to 6 PM GMT+6) the changes for better understanding. My goal is to make you happy and fulfill your needs. 

Please let me know your thoughts. 

Thank you.`,
    variables: []
  },
  {
    id: 'meeting-02',
    title: 'Meeting Link Request',
    description: 'Ask client if they are online and ready to receive a meeting link.',
    category: 'Meeting',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

Are you available for the meeting? Please let me know. Then, I will send the link to you. 

Thank you.`,
    variables: []
  },
  {
    id: 'meeting-03',
    title: 'Meeting Request - Discount / Project Clarification',
    description: 'Propose a quick alignment meeting (9 AM to 5 PM GMT+6) for project clarifications.',
    category: 'Meeting',
    isFavorite: false,
    isCustom: false,
    content: `Project Clarification meeting 
Hi there,
 
Hope you are well,
 
I need some clarification regarding the discount. Can we join a short meeting today between 9 AM and 5 PM GMT+6?
 
Please let me know your thoughts.
 
Thank you.`,
    variables: []
  },

  // 7. FIRST PROJECT UPDATE
  {
    id: 'update-first-01',
    title: 'First Work Update Template',
    description: 'Complete breakdown of initial Shopify tasks (Premium theme upload, placeholder pages, apps).',
    category: 'Update',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

Hope you're doing well.

This is your first work update.

As per your instructions, I've completed the following tasks:

01. I've designed and built a fully functional store using a premium theme based on your reference. Due to theme limitations, it may not be 100% identical to your reference website.

02. I've uploaded two products to the store using the information you provided. Since you did not provide images, the product pages do not display images. Please send the actual images, and I'll be happy to replace them. 

03. I created the following pages for your store:

  - HOME
  - SHOP
  - BLOGS
  - ABOUT US
  - CONTACT
  - 404 PAGE

04. I added a favicon to your store.

05. I optimized the website for responsiveness on all devices.

06. I added a newsletter feature to your store.

07. I included the following policy pages:

- Privacy Policy
- Terms of Service
- Contact Information

08. I installed the necessary apps:

- Shopify Inbox
- Judge.me Reviews

>>> Here is the store URL: {{store_url}}
>>> Password: {{store_password}}

Note: I used some placeholder content for the pages. If you want to change any content, please provide the updates, and I will replace them. If I missed any tasks or requirements, please let me know, and I'll take care of them. I will also provide a video walkthrough of the project.

Also, we can join the meeting about the project for any clarifications. It would be a better way for me. 

Please review the progress on your end and let me know if you have any modifications or concerns. I'll be happy to make adjustments and update you soon.

Thank you.`,
    variables: ['store_url', 'store_password']
  },

  // 8. CANCELLATIONS & REFUNDS
  {
    id: 'cancel-01',
    title: 'Cancellation Apology & Action Plan',
    description: 'Sincere response to client frustration, asking for a chance to inspect and rectify issues.',
    category: 'Cancellation',
    isFavorite: false,
    isCustom: false,
    content: `I truly apologize for any confusion or concern my actions may have caused. I completely understand your frustration—please know that was never my intent.

If there were any unintended changes or deletions, I would greatly appreciate the chance to look into what happened. This will help me explain the situation clearly and, more importantly, rectify it. I value transparency and trust immensely, and I want to ensure you feel confident in the way your website is managed.

I kindly ask you to consider giving me another opportunity to make things right and deliver the work as you originally requested. I’m dedicated to earning back your trust by closely following your instructions and keeping you informed every step of the way.

If you're open to it, I'm here to address any issues and complete the task to your satisfaction.

Thank you once again for your understanding and consideration.

Warm regards,`,
    variables: []
  },
  {
    id: 'cancel-02',
    title: 'Cancellation Alternatives (Marzia Zoom Call)',
    description: 'Arguments against cancellation, emphasizing expert knowledge and requesting a clarifying call.',
    category: 'Cancellation',
    isFavorite: false,
    isCustom: false,
    content: `I truly apologize for any confusion or concern my actions may have caused. I completely understand your frustration—please know that was never my intent.

I truly believe that cancellation isn’t the best path forward. With my extensive experience in Shopify, I’m confident that I can deliver the results you originally envisioned. I kindly ask for another opportunity to make things right. I’ll follow your instructions carefully, keep you updated at every step, and ensure the final outcome meets your expectations.

As you know, you shared the brief project details during our Zoom call, but that approach wasn’t the most effective for me to fully understand everything. To move things in the right direction, could we please schedule a short meeting at your convenience? It would be a great opportunity for me to gain complete clarity on your requirements and ensure everything aligns properly.

Thank you once again for your understanding and consideration. I truly value the trust you place in me and look forward to completing your project successfully.

Warm regards,
{{developer_name}}`,
    variables: ['developer_name']
  },
  {
    id: 'cancel-no-run',
    title: 'Client Stopped Project - Partial Refund Offer',
    description: 'Propose a 60% partial refund because work has already been performed.',
    category: 'Cancellation',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I’m really sorry to hear about the family issues you’re going through right now. I completely understand that unexpected things can come up, and I hope everything gets better soon.

I just wanted to mention that I have already spent a significant amount of time on your project. I’ve researched products, shortlisted the best options, and started preparing the necessary work to meet your requirements. A full refund would negatively affect my Fiverr profile, but I’m happy to work with you on a fair solution. Fiverr allows a partial refund (up to 60%), so if you’d like, I can submit a partial refund offer to you.

Please let me know if that works for you, and I’ll send it over right away.

Best regards,`,
    variables: []
  },
  {
    id: 'cancel-partial-manir',
    title: 'Partial Refund - Reconsider Cancellation (Manir)',
    description: 'Ask client to reconsider cancellation or negotiate a 40-60% refund.',
    category: 'Cancellation',
    isFavorite: false,
    isCustom: false,
    content: `Hi there,

I understand your frustration, and I truly respect how you’re feeling. Please take your time, there’s no problem at all. Whenever you’re free, just let me know exactly what modifications you want, and I will fix them as soon as possible.

I want to be transparent with you as well. A full refund negatively affects my Fiverr profile, and I’ve already invested a significant amount of time and effort into this project. That’s why I kindly ask you to reconsider a full cancellation.

If you still decide not to continue, we can look at a fair partial refund instead. Fiverr allows partial refunds between 40% (minimum) and 60% (maximum), and I’m open to discussing a reasonable amount that works for both of us.

My goal is to resolve this professionally without involving Fiverr support, if possible. I’m still here and ready to fix the issues if you’d like to move forward.

Looking forward to your decision.

Best regards,
{{developer_name}}`,
    variables: ['developer_name']
  },
  {
    id: 'cancel-partial-policy',
    title: 'Refund Limit Clarification (Fiverr 60% Policy)',
    description: 'Polite notice explaining that Fiverr only allows up to 60% partial refunds through its panel.',
    category: 'Cancellation',
    isFavorite: false,
    isCustom: false,
    content: `Hi {{client_name}},

Thank you for your response.

I understand that you would like to proceed with a 75% refund as a final resolution. However, as per Fiverr’s policy, the maximum partial refund that can be processed through the platform is 60%.

I am willing to proceed with a 60% refund to resolve this matter professionally and close the order amicably. Please let me know if you agree, and I will initiate the refund right away through the platform.

I appreciate your understanding.

Best regards,`,
    variables: ['client_name']
  }
];
