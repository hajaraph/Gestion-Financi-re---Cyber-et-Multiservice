import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/produit_models.dart';
import '../../services/produit_service.dart';
import '../../widgets/modal_components.dart';
import '../../providers/auth_provider.dart';
import 'produit_form_screen.dart';

class ProduitListScreen extends StatefulWidget {
  const ProduitListScreen({super.key});

  @override
  State<ProduitListScreen> createState() => _ProduitListScreenState();
}

class _ProduitListScreenState extends State<ProduitListScreen> {
  List<Produit> _produits = [];
  bool _isLoading = true;
  String? _error;
  String _searchTerm = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProduits();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProduits() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await produitService.getProduits(search: _searchTerm);

    setState(() {
      _isLoading = false;
      if (result.success) {
        _produits = result.produits;
        // Tri : Actifs en premier, puis alphabétique
        _produits.sort((a, b) {
          if (a.actif && !b.actif) return -1;
          if (!a.actif && b.actif) return 1;
          return a.designation.toLowerCase().compareTo(
            b.designation.toLowerCase(),
          );
        });
      } else {
        _error = result.error;
      }
    });
  }

  void _onSearch(String value) {
    _searchTerm = value;
    _loadProduits();
  }

  Future<void> _deleteProduit(Produit produit) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text(
          'Voulez-vous vraiment supprimer "${produit.designation}" ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await produitService.deleteProduit(produit.id);
      if (!mounted) return;
      if (success) {
        _loadProduits();
        showModernSnackBar(
          context,
          message: 'Produit supprimé',
          type: SnackBarType.success,
        );
      } else {
        showModernSnackBar(
          context,
          message: 'Erreur lors de la suppression',
          type: SnackBarType.error,
        );
      }
    }
  }

  void _navigateToForm([Produit? produit]) async {
    final result = await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ProduitFormScreen(produit: produit),
    );

    if (result == true) {
      _loadProduits();
      if (!mounted) return;
      showModernSnackBar(
        context,
        message: produit == null
            ? 'Produit créé avec succès'
            : 'Produit mis à jour avec succès',
        type: SnackBarType.success,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final canAdd = authProvider.user?.hasPermission('add_produit') ?? false;
    final canDelete =
        authProvider.user?.hasPermission('delete_produit') ?? false;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        title: Text(
          'Produits',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
      body: Column(
        children: [
          // Barre de recherche
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: AppTheme.cardShadow,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: ModernTextField(
              controller: _searchController,
              label: 'Recherche',
              hint: 'Rechercher un produit...',
              prefixIcon: const Icon(
                Icons.search,
                color: AppTheme.textSecondary,
              ),
              suffixIcon: _searchTerm.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        _searchController.clear();
                        _onSearch('');
                      },
                    )
                  : null,
              onChanged: (v) {
                setState(() => _searchTerm = v);
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (mounted && v == _searchController.text) {
                    _loadProduits();
                  }
                });
              },
              onSubmitted: (v) => _onSearch(v),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primaryBlue,
                    ),
                  )
                : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Colors.orange,
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(_error!, style: GoogleFonts.inter()),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _loadProduits,
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadProduits,
                    color: AppTheme.primaryBlue,
                    child: _produits.isEmpty
                        ? _buildEmptyState()
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _produits.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              return _ProduitItem(
                                produit: _produits[index],
                                onTap: () => _navigateToForm(_produits[index]),
                                onDelete: canDelete
                                    ? () => _deleteProduit(_produits[index])
                                    : null,
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
      floatingActionButton: canAdd
          ? FloatingActionButton(
              onPressed: () => _navigateToForm(),
              backgroundColor: AppTheme.primaryBlue,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inventory_2_outlined,
            size: 64,
            color: AppTheme.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Aucun produit trouvé',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProduitItem extends StatelessWidget {
  final Produit produit;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const _ProduitItem({
    required this.produit,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      produit.designation.isNotEmpty
                          ? produit.designation[0].toUpperCase()
                          : '?',
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              produit.designation,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: produit.actif
                                    ? AppTheme.textPrimary
                                    : AppTheme.textSecondary,
                                decoration: produit.actif
                                    ? null
                                    : TextDecoration.lineThrough,
                              ),
                            ),
                          ),
                          if (!produit.actif)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Inactif',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ),
                        ],
                      ),
                      if (produit.categorieNom != null &&
                          produit.categorieNom!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          produit.categorieNom!,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.primaryBlue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        '${currencyFormat.format(produit.prixVente)} • Stock: ${produit.stock.quantiteActuelle} ${produit.uniteMesureSymbole ?? ''}',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: produit.stock.isLowStock
                              ? AppTheme.error
                              : AppTheme.textSecondary,
                          fontWeight: produit.stock.isLowStock
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                if (onDelete != null)
                  IconButton(
                    icon: const Icon(
                      Icons.delete_outline,
                      color: AppTheme.error,
                    ),
                    onPressed: onDelete,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
