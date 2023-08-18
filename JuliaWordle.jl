### A Pluto.jl notebook ###
# v0.19.26

using Markdown
using InteractiveUtils

# This Pluto notebook uses @bind for interactivity. When running this notebook outside of Pluto, the following 'mock version' of @bind gives bound variables a default value (instead of an error).
macro bind(def, element)
    quote
        local iv = try Base.loaded_modules[Base.PkgId(Base.UUID("6e696c72-6542-2067-7265-42206c756150"), "AbstractPlutoDingetjes")].Bonds.initial_value catch; b -> missing; end
        local el = $(esc(element))
        global $(esc(def)) = Core.applicable(Base.get, el) ? Base.get(el) : iv(el)
        el
    end
end

# ╔═╡ 2bea2768-1c0c-4e21-aba6-31df658a1adb
begin
	using Printf
	using PlutoUI
end

# ╔═╡ 97bdb24d-9d67-4e4b-8fac-d7476b806ebd
md"""
## Welcome to Julia WordleBot!
"""

# ╔═╡ cdb94730-ff58-11ed-2ffa-9f6ccf05890b
try
	all_words
catch
	global all_words
	all_words = [w[1:5] for w in readlines(download("https://raw.githubusercontent.com/fbelik/Wordle/main/wordledict.csv"))[2:end]]
end

# ╔═╡ 9800d97c-308c-4974-b520-e47ae48f5019
function word_score(word,word_bank)
    # score[1] is expected greens, score[2] is expected yellows
    score = zeros(2)
    for other_word in word_bank
        yel_offset_dict = ones(Int,26)
        for i=1:5
            char_idx = Int(word[i]) - 96
            if other_word[i] == word[i]
                score[1]+=1
            elseif word[i] in other_word[yel_offset_dict[char_idx]:end]
                idx_found = findfirst(word[i],other_word[yel_offset_dict[char_idx]:end]) + (yel_offset_dict[char_idx]-1)
                if (word[idx_found] != other_word[idx_found])
                    score[2]+=1
                    yel_offset_dict[char_idx] = idx_found + 1
                elseif word[i] in other_word[idx_found+1:end]
                    score[2]+=1
                    yel_offset_dict[char_idx] = findfirst(word[i],other_word[idx_found+1:end]) + idx_found+1
                end
            end
        end
    end
    score ./= length(word_bank)
    return Tuple(score)
end

# ╔═╡ 57dba5b9-06a8-4137-8c8e-760537657b20
function rank_guesses(word_bank,N=5,strategies=[(1,0),(0,1),(2,1)])
    # Generate a list of words with their associated scores
    guess_scores = Tuple{String,Tuple{Float64,Float64}}[]
    for word in word_bank
        push!(guess_scores, Tuple([word,word_score(word,word_bank)]))
    end
    # For each strategy, return a list of top N word choices along with expected num of greens/yellows
    res = [[] for s in strategies]
    for (i,(s1,s2)) in enumerate(strategies)
        sort!(guess_scores, by=x->s1*x[2][1]+s2*x[2][2], rev=true)
        res[i] = [res[i];guess_scores[1:min(N,length(word_bank))]]
    end 
    return res
end

# ╔═╡ 53107178-e1ce-422f-a4e6-f03e63322140
function remove_from_list(word,res,word_list)
    new_list = String[]
    for other_word in word_list
        keep = true
        check = [[1,2,3,4,5] for i=1:26]
        # Check for greens
        for i=1:5
            char_idx = Int(word[i]) - 96
            if res[i] == 2
                if other_word[i] != word[i]
                    keep = false
                    break
                end
                # No longer check that index for yellows/greys
                deleteat!(check[char_idx], findall(x->x==i,check[char_idx]))
            end
        end
        if !keep
            continue
        end
        # Check for yellows 
        for i=1:5
            char_idx = Int(word[i]) - 96
            if res[i] == 1
                if other_word[i] == word[i] || !(word[i] in other_word[check[char_idx]])
                    keep = false
                    break
                end
                # No longer check that index for yellows/greys
                other_idx = 1
                while true
                    if other_idx == 6  || (other_idx in check[char_idx] && other_word[other_idx] == word[i])
                        break
                    end
                    other_idx+=1
                end
                deleteat!(check[char_idx], findall(x->x==other_idx,check[char_idx]))
            end
        end
        if !keep
            continue
        end
        # Check for greys
        for i=1:5
            char_idx = Int(word[i]) - 96
            if res[i] == 0
                if word[i] in other_word[check[char_idx]]
                    keep = false
                    break
                end
            end
        end
        if keep
            push!(new_list,other_word)
        end
    end
    return new_list
end

# ╔═╡ 14eb11f8-474a-44e1-8750-f05c94908474
md"""
### Enter wordle results below in first box, enter word followed by enter followed by numbers 0,1,2 for grey, yellow, green respectively

### For example:
### slate
### 20010
### Means: "S in word in first position, T in word in wrong position, no L, A, or E in word"
"""

# ╔═╡ 9c860f23-190d-4f99-93da-3faacb576945
@bind w1 TextField((15,2))

# ╔═╡ e3d30aee-5e49-4af2-9687-16690f675845
@bind w2 TextField((15,2))

# ╔═╡ fa1b04a2-c75b-4c07-a2c8-4729c887f820
@bind w3 TextField((15,2))

# ╔═╡ 6bbd9bbe-31fc-472b-bc1d-2e69805a75d0
@bind w4 TextField((15,2))

# ╔═╡ 88bebcd6-036c-4ba0-9a33-f92cc6bcc076
@bind w5 TextField((15,2))

# ╔═╡ 1f46dcab-f639-490d-9cf5-586a493514ca
@bind w6 TextField((15,2))

# ╔═╡ da601eee-6f4a-4a23-8992-b931f093a55f
begin
	word_dict = all_words
	guess = 1
	ws = [w1,w2,w3,w4,w5,w6]
	won = false
	try
		for i=1:6
			global word_dict,guess,won
			word = ws[guess][1:5]
			res = [parse(Int,j) for j in ws[guess][7:11]]
			if res==[2,2,2,2,2]
	            @printf("Won in %d guesses!\n",guess)
	            won = true
	        end
			word_dict = remove_from_list(word,res,word_dict)
			guess += 1
		end
	catch
		if length(ws[guess]) > 0
			@printf("Couldn't parse guess %d\nMust enter in the following form:\n[INSERT WORD]\n[INSERT 0,1,2 FOR GREY,YELLOW,GREEN]\n",guess)
		end
	end
	if !won
		for i=1:guess-1
			@printf("Guess %d: %S\n",i,ws[i][1:5])
		end
		@printf("You are on guess %d\n",guess)
		rg = rank_guesses(word_dict,5)
		println("The top guesses with the most greens are:")
		for j=1:length(rg[1])
			@printf("   %s with %.2f greens, %.2f yellows expected\n",rg[1][j][1],rg[1][j][2][1],rg[1][j][2][2])
		end
		println("The top guesses with the most yellows are:")
		for j=1:length(rg[1])
			@printf("   %s with %.2f greens, %.2f yellows expected\n",rg[2][j][1],rg[2][j][2][1],rg[2][j][2][2])
		end
		println("The top guesses with weight 2g+y are:")
		for j=1:length(rg[1])
			@printf("   %s with %.2f greens, %.2f yellows expected\n",rg[3][j][1],rg[3][j][2][1],rg[3][j][2][2])
		end
		@printf("There are %d possible words remaining\n",length(word_dict))
	end
end

# ╔═╡ 00000000-0000-0000-0000-000000000001
PLUTO_PROJECT_TOML_CONTENTS = """
[deps]
PlutoUI = "7f904dfe-b85e-4ff6-b463-dae2292396a8"
Printf = "de0858da-6303-5e67-8744-51eddeeeb8d7"

[compat]
PlutoUI = "~0.7.51"
"""

# ╔═╡ 00000000-0000-0000-0000-000000000002
PLUTO_MANIFEST_TOML_CONTENTS = """
# This file is machine-generated - editing it directly is not advised

julia_version = "1.9.0"
manifest_format = "2.0"
project_hash = "7c931c2f3424b45f82aa2acf42db50e86385a0b1"

[[deps.AbstractPlutoDingetjes]]
deps = ["Pkg"]
git-tree-sha1 = "8eaf9f1b4921132a4cff3f36a1d9ba923b14a481"
uuid = "6e696c72-6542-2067-7265-42206c756150"
version = "1.1.4"

[[deps.ArgTools]]
uuid = "0dad84c5-d112-42e6-8d28-ef12dabb789f"
version = "1.1.1"

[[deps.Artifacts]]
uuid = "56f22d72-fd6d-98f1-02f0-08ddc0907c33"

[[deps.Base64]]
uuid = "2a0f44e3-6c83-55bd-87e4-b1978d98bd5f"

[[deps.ColorTypes]]
deps = ["FixedPointNumbers", "Random"]
git-tree-sha1 = "eb7f0f8307f71fac7c606984ea5fb2817275d6e4"
uuid = "3da002f7-5984-5a60-b8a6-cbb66c0b333f"
version = "0.11.4"

[[deps.CompilerSupportLibraries_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "e66e0078-7015-5450-92f7-15fbd957f2ae"
version = "1.0.2+0"

[[deps.Dates]]
deps = ["Printf"]
uuid = "ade2ca70-3891-5945-98fb-dc099432e06a"

[[deps.Downloads]]
deps = ["ArgTools", "FileWatching", "LibCURL", "NetworkOptions"]
uuid = "f43a241f-c20a-4ad4-852c-f6b1247861c6"
version = "1.6.0"

[[deps.FileWatching]]
uuid = "7b1f6079-737a-58dc-b8bc-7a2ca5c1b5ee"

[[deps.FixedPointNumbers]]
deps = ["Statistics"]
git-tree-sha1 = "335bfdceacc84c5cdf16aadc768aa5ddfc5383cc"
uuid = "53c48c17-4a7d-5ca2-90c5-79b7896eea93"
version = "0.8.4"

[[deps.Hyperscript]]
deps = ["Test"]
git-tree-sha1 = "8d511d5b81240fc8e6802386302675bdf47737b9"
uuid = "47d2ed2b-36de-50cf-bf87-49c2cf4b8b91"
version = "0.0.4"

[[deps.HypertextLiteral]]
deps = ["Tricks"]
git-tree-sha1 = "c47c5fa4c5308f27ccaac35504858d8914e102f9"
uuid = "ac1192a8-f4b3-4bfe-ba22-af5b92cd3ab2"
version = "0.9.4"

[[deps.IOCapture]]
deps = ["Logging", "Random"]
git-tree-sha1 = "d75853a0bdbfb1ac815478bacd89cd27b550ace6"
uuid = "b5f81e59-6552-4d32-b1f0-c071b021bf89"
version = "0.2.3"

[[deps.InteractiveUtils]]
deps = ["Markdown"]
uuid = "b77e0a4c-d291-57a0-90e8-8db25a27a240"

[[deps.JSON]]
deps = ["Dates", "Mmap", "Parsers", "Unicode"]
git-tree-sha1 = "31e996f0a15c7b280ba9f76636b3ff9e2ae58c9a"
uuid = "682c06a0-de6a-54ab-a142-c8b1cf79cde6"
version = "0.21.4"

[[deps.LibCURL]]
deps = ["LibCURL_jll", "MozillaCACerts_jll"]
uuid = "b27032c2-a3e7-50c8-80cd-2d36dbcbfd21"
version = "0.6.3"

[[deps.LibCURL_jll]]
deps = ["Artifacts", "LibSSH2_jll", "Libdl", "MbedTLS_jll", "Zlib_jll", "nghttp2_jll"]
uuid = "deac9b47-8bc7-5906-a0fe-35ac56dc84c0"
version = "7.84.0+0"

[[deps.LibGit2]]
deps = ["Base64", "NetworkOptions", "Printf", "SHA"]
uuid = "76f85450-5226-5b5a-8eaa-529ad045b433"

[[deps.LibSSH2_jll]]
deps = ["Artifacts", "Libdl", "MbedTLS_jll"]
uuid = "29816b5a-b9ab-546f-933c-edad1886dfa8"
version = "1.10.2+0"

[[deps.Libdl]]
uuid = "8f399da3-3557-5675-b5ff-fb832c97cbdb"

[[deps.LinearAlgebra]]
deps = ["Libdl", "OpenBLAS_jll", "libblastrampoline_jll"]
uuid = "37e2e46d-f89d-539d-b4ee-838fcccc9c8e"

[[deps.Logging]]
uuid = "56ddb016-857b-54e1-b83d-db4d58db5568"

[[deps.MIMEs]]
git-tree-sha1 = "65f28ad4b594aebe22157d6fac869786a255b7eb"
uuid = "6c6e2e6c-3030-632d-7369-2d6c69616d65"
version = "0.1.4"

[[deps.Markdown]]
deps = ["Base64"]
uuid = "d6f4376e-aef5-505a-96c1-9c027394607a"

[[deps.MbedTLS_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "c8ffd9c3-330d-5841-b78e-0817d7145fa1"
version = "2.28.2+0"

[[deps.Mmap]]
uuid = "a63ad114-7e13-5084-954f-fe012c677804"

[[deps.MozillaCACerts_jll]]
uuid = "14a3606d-f60d-562e-9121-12d972cd8159"
version = "2022.10.11"

[[deps.NetworkOptions]]
uuid = "ca575930-c2e3-43a9-ace4-1e988b2c1908"
version = "1.2.0"

[[deps.OpenBLAS_jll]]
deps = ["Artifacts", "CompilerSupportLibraries_jll", "Libdl"]
uuid = "4536629a-c528-5b80-bd46-f80d51c5b363"
version = "0.3.21+4"

[[deps.Parsers]]
deps = ["Dates", "PrecompileTools", "UUIDs"]
git-tree-sha1 = "a5aef8d4a6e8d81f171b2bd4be5265b01384c74c"
uuid = "69de0a69-1ddd-5017-9359-2bf0b02dc9f0"
version = "2.5.10"

[[deps.Pkg]]
deps = ["Artifacts", "Dates", "Downloads", "FileWatching", "LibGit2", "Libdl", "Logging", "Markdown", "Printf", "REPL", "Random", "SHA", "Serialization", "TOML", "Tar", "UUIDs", "p7zip_jll"]
uuid = "44cfe95a-1eb2-52ea-b672-e2afdf69b78f"
version = "1.9.0"

[[deps.PlutoUI]]
deps = ["AbstractPlutoDingetjes", "Base64", "ColorTypes", "Dates", "FixedPointNumbers", "Hyperscript", "HypertextLiteral", "IOCapture", "InteractiveUtils", "JSON", "Logging", "MIMEs", "Markdown", "Random", "Reexport", "URIs", "UUIDs"]
git-tree-sha1 = "b478a748be27bd2f2c73a7690da219d0844db305"
uuid = "7f904dfe-b85e-4ff6-b463-dae2292396a8"
version = "0.7.51"

[[deps.PrecompileTools]]
deps = ["Preferences"]
git-tree-sha1 = "259e206946c293698122f63e2b513a7c99a244e8"
uuid = "aea7be01-6a6a-4083-8856-8a6e6704d82a"
version = "1.1.1"

[[deps.Preferences]]
deps = ["TOML"]
git-tree-sha1 = "7eb1686b4f04b82f96ed7a4ea5890a4f0c7a09f1"
uuid = "21216c6a-2e73-6563-6e65-726566657250"
version = "1.4.0"

[[deps.Printf]]
deps = ["Unicode"]
uuid = "de0858da-6303-5e67-8744-51eddeeeb8d7"

[[deps.REPL]]
deps = ["InteractiveUtils", "Markdown", "Sockets", "Unicode"]
uuid = "3fa0cd96-eef1-5676-8a61-b3b8758bbffb"

[[deps.Random]]
deps = ["SHA", "Serialization"]
uuid = "9a3f8284-a2c9-5f02-9a11-845980a1fd5c"

[[deps.Reexport]]
git-tree-sha1 = "45e428421666073eab6f2da5c9d310d99bb12f9b"
uuid = "189a3867-3050-52da-a836-e630ba90ab69"
version = "1.2.2"

[[deps.SHA]]
uuid = "ea8e919c-243c-51af-8825-aaa63cd721ce"
version = "0.7.0"

[[deps.Serialization]]
uuid = "9e88b42a-f829-5b0c-bbe9-9e923198166b"

[[deps.Sockets]]
uuid = "6462fe0b-24de-5631-8697-dd941f90decc"

[[deps.SparseArrays]]
deps = ["Libdl", "LinearAlgebra", "Random", "Serialization", "SuiteSparse_jll"]
uuid = "2f01184e-e22b-5df5-ae63-d93ebab69eaf"

[[deps.Statistics]]
deps = ["LinearAlgebra", "SparseArrays"]
uuid = "10745b16-79ce-11e8-11f9-7d13ad32a3b2"
version = "1.9.0"

[[deps.SuiteSparse_jll]]
deps = ["Artifacts", "Libdl", "Pkg", "libblastrampoline_jll"]
uuid = "bea87d4a-7f5b-5778-9afe-8cc45184846c"
version = "5.10.1+6"

[[deps.TOML]]
deps = ["Dates"]
uuid = "fa267f1f-6049-4f14-aa54-33bafae1ed76"
version = "1.0.3"

[[deps.Tar]]
deps = ["ArgTools", "SHA"]
uuid = "a4e569a6-e804-4fa4-b0f3-eef7a1d5b13e"
version = "1.10.0"

[[deps.Test]]
deps = ["InteractiveUtils", "Logging", "Random", "Serialization"]
uuid = "8dfed614-e22c-5e08-85e1-65c5234f0b40"

[[deps.Tricks]]
git-tree-sha1 = "aadb748be58b492045b4f56166b5188aa63ce549"
uuid = "410a4b4d-49e4-4fbc-ab6d-cb71b17b3775"
version = "0.1.7"

[[deps.URIs]]
git-tree-sha1 = "074f993b0ca030848b897beff716d93aca60f06a"
uuid = "5c2747f8-b7ea-4ff2-ba2e-563bfd36b1d4"
version = "1.4.2"

[[deps.UUIDs]]
deps = ["Random", "SHA"]
uuid = "cf7118a7-6976-5b1a-9a39-7adc72f591a4"

[[deps.Unicode]]
uuid = "4ec0a83e-493e-50e2-b9ac-8f72acf5a8f5"

[[deps.Zlib_jll]]
deps = ["Libdl"]
uuid = "83775a58-1f1d-513f-b197-d71354ab007a"
version = "1.2.13+0"

[[deps.libblastrampoline_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "8e850b90-86db-534c-a0d3-1478176c7d93"
version = "5.7.0+0"

[[deps.nghttp2_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "8e850ede-7688-5339-a07c-302acd2aaf8d"
version = "1.48.0+0"

[[deps.p7zip_jll]]
deps = ["Artifacts", "Libdl"]
uuid = "3f19e933-33d8-53b3-aaab-bd5110c3b7a0"
version = "17.4.0+0"
"""

# ╔═╡ Cell order:
# ╟─2bea2768-1c0c-4e21-aba6-31df658a1adb
# ╟─97bdb24d-9d67-4e4b-8fac-d7476b806ebd
# ╟─cdb94730-ff58-11ed-2ffa-9f6ccf05890b
# ╟─9800d97c-308c-4974-b520-e47ae48f5019
# ╟─57dba5b9-06a8-4137-8c8e-760537657b20
# ╟─53107178-e1ce-422f-a4e6-f03e63322140
# ╟─14eb11f8-474a-44e1-8750-f05c94908474
# ╟─9c860f23-190d-4f99-93da-3faacb576945
# ╟─e3d30aee-5e49-4af2-9687-16690f675845
# ╟─fa1b04a2-c75b-4c07-a2c8-4729c887f820
# ╟─6bbd9bbe-31fc-472b-bc1d-2e69805a75d0
# ╟─88bebcd6-036c-4ba0-9a33-f92cc6bcc076
# ╟─1f46dcab-f639-490d-9cf5-586a493514ca
# ╟─da601eee-6f4a-4a23-8992-b931f093a55f
# ╟─00000000-0000-0000-0000-000000000001
# ╟─00000000-0000-0000-0000-000000000002
