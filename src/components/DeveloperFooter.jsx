

const DeveloperFooter = () => {
  return (
    <footer className="w-full max-w-none mt-auto pt-8 pb-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-text-muted font-medium">Developed by</span>
        <span className="font-extrabold text-accent uppercase tracking-wider text-[11px] bg-accent-soft px-2 py-0.5 rounded border border-accent/15">
          Asim
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://linkedin.com/in/muhammad-asim"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-panel hover:bg-accent-soft border border-border hover:border-accent/30 text-text font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
          aria-label="Asim's LinkedIn Profile"
        >
          <svg className="w-4 h-4 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          <span>LinkedIn</span>
        </a>
        <a
          href="https://wa.me/447539784491"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-panel hover:bg-emerald-500/10 border border-border hover:border-emerald-500/30 text-text font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
          aria-label="Contact Asim on WhatsApp"
        >
          <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.989-1.874-1.875-4.354-2.907-6.992-2.908-5.441 0-9.867 4.426-9.871 9.87-.001 1.637.426 3.237 1.238 4.632l-.993 3.626 3.71-.973zm11.534-5.263c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.2.3-.775.979-.95 1.179-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.777-1.665-2.078-.175-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.588-.491-.508-.675-.518-.174-.01-.374-.012-.574-.012-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.11 4.522.714.31 1.272.496 1.708.635.717.228 1.37.196 1.887.119.577-.087 1.781-.727 2.031-1.43.25-.702.25-1.3.175-1.43-.075-.125-.275-.2-.575-.35z"/>
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </footer>
  )
}

export default DeveloperFooter
