export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Articles", value: "24", change: "+3 this week" },
          { title: "Published", value: "18", change: "75% of total" },
          { title: "Active Brands", value: "3", change: "2 ready" },
          { title: "AI Credits", value: "2,450", change: "85% remaining" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Articles</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your latest content drafts and publications.
          </p>
          <div className="mt-4 space-y-3">
            {[
              { title: "10 Ways to Automate Your Business", status: "Published" },
              { title: "The Complete Guide to No-Code", status: "SEO Review" },
              { title: "5 Morning Rituals for Health", status: "Draft" },
            ].map((article) => (
              <div
                key={article.title}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <span className="text-sm font-medium">{article.title}</span>
                <span className="text-xs text-muted-foreground">
                  {article.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with common tasks.
          </p>
          <div className="mt-4 grid gap-2">
            {[
              "Create new article",
              "Add a brand",
              "Invite team member",
              "Configure AI rules",
            ].map((action) => (
              <button
                key={action}
                className="flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent"
              >
                {action}
                <span className="text-muted-foreground">-&gt;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
