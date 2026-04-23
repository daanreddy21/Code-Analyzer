const pageFullInfo = {
  "/dashboard": {
    title: "Dashboard - Complete Overview",
    description:
      "This is your main control center where you monitor code quality, performance trends, and AI insights.",

    sections: [
      {
        name: "Welcome Section",
        details:
          "Displays greeting and purpose of dashboard. Helps user understand that this is the main analytics page."
      },
      {
        name: "Stats Cards",
        details:
          "Shows total scans, average quality score, and bugs detected. Data comes from backend /code/stats API."
      },
      {
        name: "Graph Section",
        details:
          "Visualizes code performance over time using charts. Helps identify improvement trends and bug patterns."
      },
      {
        name: "Recurring Issues",
        details:
          "Detects repeated coding mistakes. Helps user improve coding habits."
      },
      {
        name: "AI Suggestions",
        details:
          "Provides intelligent recommendations based on past code analysis."
      },
      {
        name: "Recent Scans Table",
        details:
          "Shows recently analyzed files with score and bugs. Quick navigation to history page."
      }
    ],

    popups: [
      {
        name: "Project Submission Modal",
        details:
          "Allows user to upload and submit projects. Used for evaluation and tracking."
      },
      {
        name: "Message Popup",
        details:
          "Displays notifications and messages in real-time using socket connection."
      }
    ]
  },

  "/history": {
    title: "History Page",
    description:
      "Stores all submitted code and allows detailed analysis, editing, and tracking.",

    sections: [
      {
        name: "Code Table",
        details:
          "Displays all code submissions with status (approved/rejected/pending)."
      },
      {
        name: "Deleted Files",
        details:
          "Soft delete feature. Allows restoring deleted files."
      },
      {
        name: "Code Viewer Modal",
        details:
          "Shows selected code with editing and analysis features."
      },
      {
        name: "Live Analysis",
        details:
          "Detects real-time impact of code changes using backend comparison."
      },
      {
        name: "AI Analysis",
        details:
          "Provides intelligent insights and suggestions."
      },
      {
        name: "Comments Section",
        details:
          "Users can comment and collaborate. Uses real-time socket updates."
      }
    ],

    popups: [
      {
        name: "Edit Code Modal",
        details:
          "Allows editing and resubmitting code."
      },
      {
        name: "Analysis Modal",
        details:
          "Displays code quality analysis and issues."
      }
    ]
  },

  "/compare": {
    title: "Code Compare Page",
    description:
      "Compare two files and visually identify differences.",

    sections: [
      {
        name: "File Upload",
        details:
          "Upload two files for comparison with validation."
      },
      {
        name: "Editors",
        details:
          "Monaco editors used to display code side-by-side."
      },
      {
        name: "Diff Engine",
        details:
          "Uses diffLines to detect added, removed, and unchanged lines."
      },
      {
        name: "Highlighting",
        details:
          "Green = added, Red = removed, Transparent = unchanged."
      }
    ],

    popups: [
      {
        name: "Version History Panel",
        details:
          "Displays previous versions of files."
      }
    ]
  },

  "/profile": {
    title: "Profile Page",
    description:
      "Manage your personal information, settings, and account security.",

    sections: [
      {
        name: "Profile Form",
        details:
          "Edit personal details like name, bio, and links."
      },
      {
        name: "Image Upload",
        details:
          "Upload and preview profile picture."
      },
      {
        name: "Settings",
        details:
          "Toggle notifications and preferences."
      },
      {
        name: "Password Reset",
        details:
          "Securely reset your password."
      }
    ],

    popups: [
      {
        name: "Password Reset Modal",
        details:
          "Handles password update process."
      }
    ]
  },

  "/analyzer": {
   title: "Code Submission Area",
      description: "This is where you write or upload code.",
      sections: [
        {
          name: "Code Input",
          details: "Paste or type your code."
        },
        {
          name: "File Upload",
          details: "Upload code file."
        },
        {
          name: "Edit Code",
          details: "Modify code before analysis."
        },
        {
          name: "Next Step",
          details: "Proceed to analysis phase."
        }
      ],

  popups: [
    {
      name: "Error Details Popup",
      details:
        "Shows detailed explanation of a specific issue including where it occurs and how to fix it."
    }
  ]
},

"/code-runner": {
  title: "Code Runner Page",
  description:
    "This page allows you to execute your code and see real-time output.",

  sections: [
    {
      name: "Code Editor",
      details:
        "Write or paste your code here. Supports multiple languages."
    },
    {
      name: "Input Section",
      details:
        "Provide custom input for your program. Useful for testing different cases."
    },
    {
      name: "Run Button",
      details:
        "Executes your code by sending it to the backend execution API."
    },
    {
      name: "Output Console",
      details:
        "Displays the output generated by your code after execution."
    },
    {
      name: "Error Console",
      details:
        "Shows runtime errors, syntax errors, or execution failures."
    }
  ],

  popups: [
    {
      name: "Execution Error Popup",
      details:
        "Displays detailed error messages when code execution fails."
    }
  ]
},

"/explain": {
  title: "Explain Code Page",
  description:
    "This page helps you understand code by generating human-readable explanations using AI.",

  sections: [
    {
      name: "Code Input Area",
      details:
        "Paste or upload code that you want to understand."
    },
    {
      name: "Explain Button",
      details:
        "Triggers AI explanation. Sends code to backend and generates detailed explanation."
    },
    {
      name: "Explanation Output",
      details:
        "Displays step-by-step explanation of the code logic."
    },
    {
      name: "Simplified Explanation",
      details:
        "Provides beginner-friendly explanation of complex logic."
    },
    {
      name: "Use Cases Section",
      details:
        "Shows real-world use cases of the given code."
    }
  ],

  popups: [
    {
      name: "AI Explanation Popup",
      details:
        "Displays detailed breakdown of code including logic, flow, and examples."
    }
  ]
},

};

export default pageFullInfo;